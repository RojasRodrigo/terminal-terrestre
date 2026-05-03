import { useEffect, useRef } from 'react';
import type { PasoDijkstra } from '@/types';

interface Props {
  pasos: PasoDijkstra[];
  optimizar?: 'distancia' | 'duracion';
  onClear?: () => void;
}

const stepConfig = {
  visitar:    { color: '#6366f1', bg: '#eef2ff', icono: '◉', label: 'Visitar'    },
  relajar:    { color: '#f59e0b', bg: '#fffbeb', icono: '↺', label: 'Relajar'    },
  finalizado: { color: '#10b981', bg: '#f0fdf4', icono: '✓', label: 'Finalizado' },
};

export default function DijkstraLog({ pasos, optimizar = 'distancia', onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const unidad = optimizar === 'duracion' ? 'min' : 'km';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pasos.length]);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
            Log del algoritmo
          </span>
          <span style={{
            background: '#f1f5f9', color: '#64748b',
            fontSize: 11, borderRadius: 20, padding: '1px 8px',
          }}>
            {pasos.length} pasos
          </span>
        </div>
        {onClear && pasos.length > 0 && (
          <button onClick={onClear} style={{
            padding: '3px 10px', borderRadius: 6,
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: 11, cursor: 'pointer', color: '#64748b',
          }}>
            Limpiar
          </button>
        )}
      </div>

      <div style={{
        height: 220, overflowY: 'auto', padding: '8px 0',
        fontFamily: 'ui-monospace, monospace', fontSize: 12,
      }}>
        {pasos.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
            Ejecuta Dijkstra para ver los pasos en tiempo real
          </div>
        ) : pasos.map((p, i) => {
          const cfg = stepConfig[p.tipo];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '5px 14px',
              background: i === pasos.length - 1 ? cfg.bg : 'transparent',
              borderLeft: i === pasos.length - 1 ? `3px solid ${cfg.color}` : '3px solid transparent',
            }}>
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icono}</span>
              <span style={{ color: '#64748b', flexShrink: 0, minWidth: 60 }}>
                {cfg.label}
              </span>
              <span style={{ color: '#1e293b', fontWeight: p.tipo === 'visitar' ? 500 : 400 }}>
                {p.nodo}
                {p.desde && <span style={{ color: '#94a3b8' }}> ← {p.desde}</span>}
              </span>
              {p.distancia >= 0 && (
                <span style={{ color: '#6366f1', marginLeft: 'auto', flexShrink: 0 }}>
                  {p.distancia} {unidad}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}
