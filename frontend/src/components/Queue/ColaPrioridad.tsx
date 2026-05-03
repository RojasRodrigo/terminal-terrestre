import type { DespachoDetalle } from '@/types';
import { ArrowRight, AlertCircle, Clock, Bus } from 'lucide-react';

interface Props {
  cola: DespachoDetalle[];
  onDespachar?: (id: string) => void;
  onCancelar?:  (id: string) => void;
}

const urgConfig = {
  normal:  { color: '#10b981', bg: '#f0fdf4', label: 'Normal',   icon: '●' },
  alta:    { color: '#f59e0b', bg: '#fffbeb', label: 'Alta',     icon: '▲' },
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica',  icon: '!' },
};

function PrioridadBar({ valor }: { valor: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          width: 5, height: 12, borderRadius: 2,
          background: i < valor ? '#6366f1' : '#e2e8f0',
          transition: 'background 0.2s',
        }}/>
      ))}
      <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4 }}>{valor}/10</span>
    </div>
  );
}

export default function ColaPrioridad({ cola, onDespachar, onCancelar }: Props) {
  if (cola.length === 0) {
    return (
      <div style={{
        padding: 40, textAlign: 'center', color: '#94a3b8',
        border: '2px dashed #e2e8f0', borderRadius: 12,
      }}>
        <Bus size={32} style={{ opacity: 0.3, marginBottom: 8 }}/>
        <p style={{ margin: 0, fontSize: 14 }}>Cola vacía — no hay despachos pendientes</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cola.map((d, idx) => {
        const urg = urgConfig[d.urgencia];
        const hora = new Date(d.hora_programada).toLocaleTimeString('es-BO', {
          hour: '2-digit', minute: '2-digit',
        });
        const minutos = Math.max(
          0,
          Math.round((new Date(d.hora_programada).getTime() - Date.now()) / 60000)
        );

        return (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: idx === 0 ? urg.bg : '#fff',
            border: `1px solid ${idx === 0 ? urg.color + '40' : '#e2e8f0'}`,
            borderRadius: 10,
            padding: '14px 16px',
            position: 'relative',
            transition: 'all 0.2s',
          }}>
            {/* Posición en cola */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: idx === 0 ? urg.color : '#f1f5f9',
              color: idx === 0 ? '#fff' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>
              {idx + 1}
            </div>

            {/* Urgencia badge */}
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              background: urg.bg, color: urg.color,
              border: `1px solid ${urg.color}30`,
              borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
            }}>
              <span>{urg.icon}</span>{urg.label}
            </div>

            {/* Info principal */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                  {d.bus_placa}
                </span>
                {d.bus_empresa && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>· {d.bus_empresa}</span>
                )}
                {d.plataforma_num && (
                  <span style={{
                    fontSize: 11, color: '#6366f1',
                    background: '#eef2ff', borderRadius: 4, padding: '1px 6px',
                  }}>
                    Plataforma {d.plataforma_num}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                <span>{d.origen_nombre}</span>
                <ArrowRight size={12}/>
                <span>{d.dest_nombre}</span>
                <span style={{ color: '#94a3b8' }}>· {d.distancia_km} km</span>
              </div>
              <PrioridadBar valor={d.prioridad}/>
            </div>

            {/* Tiempo */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                <Clock size={12} color="#94a3b8"/>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{hora}</span>
              </div>
              <span style={{
                fontSize: 11,
                color: minutos <= 15 ? '#ef4444' : minutos <= 30 ? '#f59e0b' : '#94a3b8',
              }}>
                {minutos <= 0 ? '¡Ahora!' : `en ${minutos} min`}
              </span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {d.estado === 'pendiente' && onDespachar && (
                <button
                  onClick={() => onDespachar(d.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: 'none',
                    background: '#6366f1', color: '#fff',
                    fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  → Plataforma
                </button>
              )}
              {d.estado === 'en_plataforma' && onDespachar && (
                <button
                  onClick={() => onDespachar(d.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: 'none',
                    background: '#10b981', color: '#fff',
                    fontSize: 11, cursor: 'pointer',
                  }}>
                  ✓ Despachar
                </button>
              )}
              {onCancelar && (
                <button
                  onClick={() => onCancelar(d.id)}
                  style={{
                    padding: '5px 8px', borderRadius: 6,
                    border: '1px solid #fecaca', background: '#fff',
                    color: '#ef4444', fontSize: 11, cursor: 'pointer',
                  }}>
                  <AlertCircle size={11}/>
                </button>
              )}
            </div>

            {/* Indicador lateral para el primero en cola */}
            {idx === 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 8, bottom: 8,
                width: 3, borderRadius: '0 3px 3px 0',
                background: urg.color,
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}
