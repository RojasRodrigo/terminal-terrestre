import { query } from '../utils/db';
import type {
  ListaAdyacencia,
  Vecino,
  ResultadoDijkstra,
  PasoDijkstra,
} from '../models/types';

// ── Min-Heap genérico ────────────────────────────────────────
class MinHeap<T> {
  private data: [number, T][] = [];

  push(priority: number, item: T): void {
    this.data.push([priority, item]);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): [number, T] | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.data.length; }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent][0] > this.data[i][0]) {
        [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l][0] < this.data[min][0]) min = l;
      if (r < n && this.data[r][0] < this.data[min][0]) min = r;
      if (min === i) break;
      [this.data[min], this.data[i]] = [this.data[i], this.data[min]];
      i = min;
    }
  }
}

// ── Construir lista de adyacencia desde PostgreSQL ───────────
export async function construirGrafo(): Promise<ListaAdyacencia> {
  const rows = await query<{
    origen_id: string; origen_nombre: string;
    dest_id: string;   dest_nombre: string;
    distancia_km: number; duracion_min: number; ruta_id: string;
  }>(`
    SELECT
      r.ciudad_origen_id AS origen_id,
      co.nombre          AS origen_nombre,
      r.ciudad_dest_id   AS dest_id,
      cd.nombre          AS dest_nombre,
      r.distancia_km,
      r.duracion_min,
      r.id               AS ruta_id
    FROM rutas r
    JOIN ciudades co ON co.id = r.ciudad_origen_id
    JOIN ciudades cd ON cd.id = r.ciudad_dest_id
    WHERE r.activo = TRUE AND co.activo = TRUE AND cd.activo = TRUE
  `);

  const grafo: ListaAdyacencia = {};

  for (const row of rows) {
    if (!grafo[row.origen_id]) grafo[row.origen_id] = [];
    const vecino: Vecino = {
      ciudadId:    row.dest_id,
      nombre:      row.dest_nombre,
      distanciaKm: row.distancia_km,
      duracionMin:  row.duracion_min,
      rutaId:      row.ruta_id,
    };
    grafo[row.origen_id].push(vecino);
  }

  return grafo;
}

// ── Algoritmo de Dijkstra ────────────────────────────────────
export function dijkstra(
  grafo: ListaAdyacencia,
  origenId: string,
  destinoId: string,
  nombresPorId: Record<string, string>,
  usarDuracion = false,
): ResultadoDijkstra {
  const INF = Infinity;
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const pasos: PasoDijkstra[] = [];
  const visitado = new Set<string>();

  for (const id of Object.keys(grafo)) {
    dist[id] = INF;
    prev[id] = null;
  }
  dist[origenId] = 0;

  const heap = new MinHeap<string>();
  heap.push(0, origenId);

  while (heap.size > 0) {
    const entry = heap.pop();
    if (!entry) break;
    const [d, u] = entry;

    if (visitado.has(u)) continue;
    visitado.add(u);

    pasos.push({
      tipo: 'visitar',
      nodo: nombresPorId[u] ?? u,
      distancia: d,
      distancias: { ...dist },
    });

    if (u === destinoId) break;

    for (const vecino of (grafo[u] ?? [])) {
      if (visitado.has(vecino.ciudadId)) continue;
      const peso = usarDuracion ? vecino.duracionMin : vecino.distanciaKm;
      const nd = dist[u] + peso;
      if (nd < dist[vecino.ciudadId]) {
        dist[vecino.ciudadId] = nd;
        prev[vecino.ciudadId] = u;
        heap.push(nd, vecino.ciudadId);
        pasos.push({
          tipo: 'relajar',
          nodo: vecino.nombre,
          desde: nombresPorId[u] ?? u,
          distancia: nd,
          distancias: { ...dist },
        });
      }
    }
  }

  // Reconstruir ruta
  const rutaIds: string[] = [];
  let cur: string | null = destinoId;
  while (cur !== null) {
    rutaIds.unshift(cur);
    cur = prev[cur] ?? null;
  }

  const valida = rutaIds[0] === origenId && dist[destinoId] !== INF;

  pasos.push({
    tipo: 'finalizado',
    nodo: nombresPorId[destinoId] ?? destinoId,
    distancia: valida ? dist[destinoId] : -1,
    distancias: { ...dist },
  });

  // Calcular duración total sumando aristas de la ruta
  let duracionTotal = 0;
  if (valida) {
    for (let i = 0; i < rutaIds.length - 1; i++) {
      const vecinos = grafo[rutaIds[i]] ?? [];
      const arista = vecinos.find(v => v.ciudadId === rutaIds[i + 1]);
      if (arista) duracionTotal += arista.duracionMin;
    }
  }

  return {
    ruta:           valida ? rutaIds.map(id => nombresPorId[id] ?? id) : [],
    rutaIds:        valida ? rutaIds : [],
    distanciaTotal: valida ? dist[destinoId] : -1,
    duracionTotal,
    pasos,
  };
}
