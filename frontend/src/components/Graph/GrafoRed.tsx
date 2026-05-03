import { useEffect, useRef } from 'react';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
import type { Ciudad, Ruta, ResultadoDijkstra } from '@/types';

interface Props {
  ciudades: Ciudad[];
  rutas: Ruta[];
  resultado?: ResultadoDijkstra | null;
  pasoActual?: string | null; // nombre de ciudad siendo procesada
}

// Posiciones fijas aproximadas para Bolivia (normalizadas 0-1)
const POSICIONES: Record<string, { x: number; y: number }> = {
  'La Paz':     { x: 120, y: 80  },
  'Cochabamba': { x: 310, y: 200 },
  'Oruro':      { x: 190, y: 190 },
  'Potosí':     { x: 190, y: 310 },
  'Sucre':      { x: 340, y: 295 },
  'Santa Cruz': { x: 530, y: 195 },
  'Trinidad':   { x: 490, y: 80  },
  'Tarija':     { x: 310, y: 400 },
};

export default function GrafoRed({ ciudades, rutas, resultado, pasoActual }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Inicializar Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = ciudades.map(c => ({
      data: { id: c.nombre, label: c.nombre },
      position: POSICIONES[c.nombre] ?? {
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 300,
      },
    }));

    // Deduplicar: solo mostrar una dirección por par
    const vistas = new Set<string>();
    const edges = rutas
      .filter(r => {
        const clave = [r.origen_nombre, r.dest_nombre].sort().join('||');
        if (vistas.has(clave)) return false;
        vistas.add(clave);
        return true;
      })
      .map(r => ({
        data: {
          id:     `${r.origen_nombre}-${r.dest_nombre}`,
          source: r.origen_nombre,
          target: r.dest_nombre,
          label:  `${r.distancia_km} km`,
          distancia: r.distancia_km,
        },
      }));

    const cy = cytoscape({
      container: containerRef.current,
      elements:  { nodes, edges },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#e0e7ff',
            'border-color':     '#6366f1',
            'border-width':     2,
            'label':            'data(label)',
            'color':            '#1e293b',
            'font-size':        11,
            'text-valign':      'center',
            'text-halign':      'center',
            'width':            60,
            'height':           60,
            'text-wrap':        'wrap',
            'text-max-width':   55,
          },
        },
        {
          selector: 'edge',
          style: {
            'width':            2,
            'line-color':       '#cbd5e1',
            'target-arrow-color': '#cbd5e1',
            'target-arrow-shape': 'none',
            'curve-style':      'bezier',
            'label':            'data(label)',
            'font-size':        10,
            'color':            '#64748b',
            'text-background-color': '#fff',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
          },
        },
        {
          selector: 'node.visitado',
          style: { 'background-color': '#4ade80', 'border-color': '#16a34a' },
        },
        {
          selector: 'node.actual',
          style: {
            'background-color': '#6366f1',
            'border-color':     '#4338ca',
            'border-width':     3,
            'color':            '#fff',
          },
        },
        {
          selector: 'node.ruta',
          style: {
            'background-color': '#fb923c',
            'border-color':     '#ea580c',
            'border-width':     3,
            'color':            '#fff',
          },
        },
        {
          selector: 'edge.ruta',
          style: {
            'line-color':   '#f97316',
            'width':        4,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#f97316',
          },
        },
      ],
      layout: { name: 'preset' },
      userZoomingEnabled:    true,
      userPanningEnabled:    true,
      boxSelectionEnabled:   false,
    });

    // Tooltip al pasar el cursor
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      node.style('border-width', 4);
    });
    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      if (!node.hasClass('actual') && !node.hasClass('ruta')) {
        node.style('border-width', 2);
      }
    });

    cyRef.current = cy;
    return () => cy.destroy();
  }, [ciudades, rutas]);

  // Resaltar ruta óptima
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('ruta visitado actual');

    if (resultado && resultado.ruta.length > 1) {
      resultado.ruta.forEach(nombre => {
        cy.$(`node[id="${nombre}"]`).addClass('ruta');
      });
      for (let i = 0; i < resultado.ruta.length - 1; i++) {
        const a = resultado.ruta[i];
        const b = resultado.ruta[i + 1];
        cy.$(`edge[source="${a}"][target="${b}"], edge[source="${b}"][target="${a}"]`)
          .addClass('ruta');
      }
    }
  }, [resultado]);

  // Resaltar nodo actual del paso Dijkstra
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !pasoActual) return;
    cy.$('.actual').removeClass('actual');
    cy.$(`node[id="${pasoActual}"]`).addClass('actual');
  }, [pasoActual]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{
        width: '100%', height: 420,
        border: '1px solid #e2e8f0', borderRadius: 12,
        background: '#f8fafc',
      }}/>
      {/* Leyenda */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(255,255,255,0.95)', borderRadius: 8,
        border: '1px solid #e2e8f0', padding: '8px 12px',
        fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[
          { color: '#e0e7ff', border: '#6366f1', label: 'Ciudad' },
          { color: '#4ade80', border: '#16a34a', label: 'Visitada' },
          { color: '#6366f1', border: '#4338ca', label: 'Procesando' },
          { color: '#fb923c', border: '#ea580c', label: 'Ruta óptima' },
        ].map(({ color, border, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: color, border: `2px solid ${border}`, flexShrink: 0,
            }}/>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
