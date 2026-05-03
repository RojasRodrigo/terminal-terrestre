import { useQuery } from '@tanstack/react-query';
import { getCiudades, getRutas, getBuses } from '@/services/api';
import { useStore } from '@/store';
import StatCard from '@/components/Dashboard/StatCard';
import { Bus, Map, AlertTriangle, CheckCircle, Activity, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: ciudades = [] } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
  const { data: rutas    = [] } = useQuery({ queryKey: ['rutas'],    queryFn: getRutas });
  const { data: buses    = [] } = useQuery({ queryKey: ['buses'],    queryFn: getBuses });
  const cola       = useStore(s => s.cola);
  const wsConectado = useStore(s => s.wsConectado);

  const criticos   = cola.filter(d => d.urgencia === 'critica').length;
  const pendientes = cola.filter(d => d.estado === 'pendiente').length;
  const enPlataforma = cola.filter(d => d.estado === 'en_plataforma').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1e293b' }}>
          Panel de operaciones
        </h2>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          color: wsConectado ? '#10b981' : '#ef4444',
          background: wsConectado ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${wsConectado ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 20, padding: '4px 12px',
        }}>
          {wsConectado ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
          {wsConectado ? 'WebSocket en línea' : 'WebSocket desconectado'}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Ciudades"     value={ciudades.length} sub="nodos del grafo"          color="#6366f1" Icon={Map}/>
        <StatCard label="Rutas"        value={rutas.length/2}  sub="conexiones disponibles"   color="#0ea5e9" Icon={Activity}/>
        <StatCard label="Buses"        value={buses.length}    sub="flota registrada"          color="#10b981" Icon={Bus}/>
        <StatCard label="En cola"      value={pendientes}      sub="despachos pendientes"      color="#f59e0b" Icon={Clock}/>
        <StatCard label="En plataforma" value={enPlataforma}   sub="listos para salir"         color="#8b5cf6" Icon={Bus}/>
        <StatCard label="Urgencia crítica" value={criticos}    sub="requieren atención"        color="#ef4444" Icon={AlertTriangle}/>
      </div>

      {/* Cola activa */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
            Cola de despachos
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {cola.length} en cola · actualización en tiempo real
          </span>
        </div>

        {cola.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay despachos activos en este momento
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Bus', 'Ruta', 'Salida', 'Urgencia', 'Estado', 'Plataforma'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cola.map((d, i) => {
                const urgColor = { normal: '#10b981', alta: '#f59e0b', critica: '#ef4444' }[d.urgencia];
                return (
                  <tr key={d.id} style={{
                    borderTop: '1px solid #f1f5f9',
                    background: d.urgencia === 'critica' ? '#fff5f5' : i % 2 ? '#fafafa' : '#fff',
                  }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>{d.bus_placa}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{d.origen_nombre} → {d.dest_nombre}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>
                      {new Date(d.hora_programada).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: urgColor + '18', color: urgColor,
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {d.urgencia}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', textTransform: 'capitalize' }}>
                      {d.estado.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>
                      {d.plataforma_num ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
