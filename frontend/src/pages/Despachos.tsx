import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCola, getBuses, getRutas, crearDespacho, actualizarEstado } from '@/services/api';
import { useStore } from '@/store';
import ColaPrioridad from '@/components/Queue/ColaPrioridad';
import type { Urgencia } from '@/types';
import { Plus, History } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: 13, width: '100%', boxSizing: 'border-box',
};

export default function Despachos() {
  const qc = useQueryClient();
  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: getBuses });
  const { data: rutas = [] } = useQuery({ queryKey: ['rutas'], queryFn: getRutas });
  const cola    = useStore(s => s.cola);
  const setCola = useStore(s => s.setCola);
  const { data: colaData } = useQuery({
    queryKey: ['cola'],
    queryFn: getCola,
    refetchInterval: 15000,
    onSuccess: (d) => setCola(d),
  } as any);

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'cola' | 'historial'>('cola');

  const [form, setForm] = useState({
    bus_id: '', ruta_id: '', hora_programada: '',
    prioridad: 5, urgencia: 'normal' as Urgencia,
    plataforma_num: '', pasajeros: '', notas: '',
  });
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const crear = useMutation({
    mutationFn: () => crearDespacho({
      ...form,
      plataforma_num: form.plataforma_num ? Number(form.plataforma_num) : undefined,
      pasajeros:      form.pasajeros      ? Number(form.pasajeros)      : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cola'] });
      setShowForm(false);
      setForm({ bus_id:'', ruta_id:'', hora_programada:'', prioridad:5, urgencia:'normal', plataforma_num:'', pasajeros:'', notas:'' });
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => actualizarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cola'] }),
  });

  const avanzar = (id: string) => {
    const item = cola.find(d => d.id === id);
    if (!item) return;
    const sig = item.estado === 'pendiente' ? 'en_plataforma' : 'despachado';
    cambiarEstado.mutate({ id, estado: sig });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, color: '#1e293b' }}>Despachos</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Cola de prioridad — ordenada por urgencia, prioridad y hora programada
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 8, border: 'none',
          background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer',
        }}>
          <Plus size={15}/>Nuevo despacho
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 15, color: '#1e293b' }}>Registrar despacho</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bus disponible</label>
              <select style={inputStyle} value={form.bus_id} onChange={upd('bus_id')}>
                <option value="">Seleccionar bus...</option>
                {buses.filter(b => b.estado === 'disponible').map(b =>
                  <option key={b.id} value={b.id}>{b.placa} · {b.empresa ?? '—'} · {b.capacidad} pas.</option>
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Ruta</label>
              <select style={inputStyle} value={form.ruta_id} onChange={upd('ruta_id')}>
                <option value="">Seleccionar ruta...</option>
                {rutas.map(r =>
                  <option key={r.id} value={r.id}>{r.origen_nombre} → {r.dest_nombre} ({r.distancia_km} km)</option>
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Hora programada</label>
              <input type="datetime-local" style={inputStyle} value={form.hora_programada} onChange={upd('hora_programada')}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Urgencia</label>
              <select style={inputStyle} value={form.urgencia} onChange={upd('urgencia')}>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Prioridad base: <b>{form.prioridad}</b>/10
              </label>
              <input type="range" min={1} max={10} value={form.prioridad}
                onChange={e => setForm(f => ({...f, prioridad: Number(e.target.value)}))}
                style={{ width: '100%', accentColor: '#6366f1' }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Plataforma N°</label>
              <input type="number" min={1} style={inputStyle} placeholder="Opcional" value={form.plataforma_num} onChange={upd('plataforma_num')}/>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Notas</label>
              <textarea rows={2} style={{...inputStyle, resize: 'none'}} value={form.notas} onChange={upd('notas')}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => crear.mutate()}
              disabled={!form.bus_id || !form.ruta_id || !form.hora_programada || crear.isPending}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer',
                opacity: (!form.bus_id || !form.ruta_id || !form.hora_programada) ? 0.5 : 1,
              }}>
              {crear.isPending ? 'Guardando...' : 'Guardar despacho'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[{ id: 'cola', label: `Cola activa (${cola.length})` }, { id: 'historial', label: 'Historial' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#1e293b' : '#64748b',
              fontWeight: tab === t.id ? 500 : 400,
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cola */}
      {tab === 'cola' && (
        <ColaPrioridad
          cola={cola}
          onDespachar={avanzar}
          onCancelar={id => cambiarEstado.mutate({ id, estado: 'cancelado' })}
        />
      )}

      {/* Historial placeholder */}
      {tab === 'historial' && (
        <div style={{
          padding: 40, textAlign: 'center', color: '#94a3b8',
          border: '2px dashed #e2e8f0', borderRadius: 12,
        }}>
          <History size={32} style={{ opacity: 0.3, marginBottom: 8 }}/>
          <p style={{ margin: 0, fontSize: 14 }}>Historial de despachos completados</p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>Usa GET /api/despachos/historial</p>
        </div>
      )}
    </div>
  );
}
