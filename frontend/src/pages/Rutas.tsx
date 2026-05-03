import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCiudades, getRutas, calcularTrayecto } from '@/services/api';
import { useStore } from '@/store';
import GrafoRed from '@/components/Graph/GrafoRed';
import DijkstraLog from '@/components/Graph/DijkstraLog';
import type { ResultadoDijkstra } from '@/types';
import { Search, Route, Clock, MapPin } from 'lucide-react';

export default function Rutas() {
  const { data: ciudades = [] } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
  const { data: rutas    = [] } = useQuery({ queryKey: ['rutas'],    queryFn: getRutas });
  const clearPasos = useStore(s => s.clearPasos);
  const pasos      = useStore(s => s.pasosDijkstra);

  const [origenId,  setOrigenId]  = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [optimizar, setOptimizar] = useState<'distancia' | 'duracion'>('distancia');
  const [resultado, setResultado] = useState<ResultadoDijkstra | null>(null);
  const [cargando,  setCargando]  = useState(false);

  const pasoActual = pasos.filter(p => p.tipo === 'visitar').at(-1)?.nodo ?? null;

  const handleCalcular = async () => {
    if (!origenId || !destinoId || origenId === destinoId) return;
    clearPasos();
    setResultado(null);
    setCargando(true);
    try {
      const res = await calcularTrayecto(origenId, destinoId, optimizar);
      setResultado(res);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 600, color: '#1e293b' }}>
        Red de rutas — Algoritmo Dijkstra
      </h2>

      {/* Panel de control */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <MapPin size={11} style={{ verticalAlign: 'middle' }}/> Ciudad origen
            </label>
            <select value={origenId} onChange={e => setOrigenId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, minWidth: 170 }}>
              <option value="">Seleccionar...</option>
              {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <MapPin size={11} style={{ verticalAlign: 'middle' }}/> Ciudad destino
            </label>
            <select value={destinoId} onChange={e => setDestinoId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, minWidth: 170 }}>
              <option value="">Seleccionar...</option>
              {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Optimizar por</label>
            <select value={optimizar} onChange={e => setOptimizar(e.target.value as 'distancia' | 'duracion')}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
              <option value="distancia">Distancia (km)</option>
              <option value="duracion">Duración (min)</option>
            </select>
          </div>
          <button onClick={handleCalcular} disabled={cargando || !origenId || !destinoId || origenId === destinoId}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer',
              opacity: (!origenId || !destinoId || cargando) ? 0.5 : 1,
            }}>
            <Search size={14}/>{cargando ? 'Calculando...' : 'Calcular ruta óptima'}
          </button>
          {pasos.length > 0 && (
            <button onClick={() => { clearPasos(); setResultado(null); }}
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
              Limpiar
            </button>
          )}
        </div>

        {/* Resultado */}
        {resultado && resultado.ruta.length > 0 && (
          <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Route size={15} color="#16a34a"/>
              <span style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>Ruta óptima encontrada</span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#1e293b' }}>
              {resultado.ruta.join(' → ')}
            </p>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="#64748b"/>
                <span style={{ color: '#64748b' }}>Distancia:</span>
                <b style={{ color: '#1e293b' }}>{resultado.distanciaTotal} km</b>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color="#64748b"/>
                <span style={{ color: '#64748b' }}>Duración:</span>
                <b style={{ color: '#1e293b' }}>
                  {Math.floor(resultado.duracionTotal / 60)}h {resultado.duracionTotal % 60}min
                </b>
              </span>
              <span style={{ color: '#64748b' }}>
                Pasos ejecutados: <b style={{ color: '#1e293b' }}>{resultado.pasos.length}</b>
              </span>
            </div>
          </div>
        )}
        {resultado && resultado.ruta.length === 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
            No existe ruta entre las ciudades seleccionadas.
          </div>
        )}
      </div>

      {/* Grafo */}
      <div style={{ marginBottom: 20 }}>
        <GrafoRed
          ciudades={ciudades}
          rutas={rutas}
          resultado={resultado}
          pasoActual={pasoActual}
        />
      </div>

      {/* Log de pasos */}
      <DijkstraLog pasos={pasos} optimizar={optimizar} onClear={clearPasos}/>
    </div>
  );
}
