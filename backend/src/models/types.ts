// ── Ciudades ────────────────────────────────────────────────
export interface Ciudad {
  id: string;
  nombre: string;
  codigo: string;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
}

// ── Rutas ───────────────────────────────────────────────────
export interface Ruta {
  id: string;
  ciudad_origen_id: string;
  ciudad_dest_id: string;
  distancia_km: number;
  duracion_min: number;
  activo: boolean;
}

export interface RutaConCiudades extends Ruta {
  origen_nombre: string;
  dest_nombre: string;
}

// ── Grafo (lista de adyacencia) ─────────────────────────────
export interface Vecino {
  ciudadId: string;
  nombre: string;
  distanciaKm: number;
  duracionMin: number;
  rutaId: string;
}

export type ListaAdyacencia = Record<string, Vecino[]>;

// ── Dijkstra ────────────────────────────────────────────────
export interface ResultadoDijkstra {
  ruta: string[];          // array de nombres de ciudades
  rutaIds: string[];       // array de ids
  distanciaTotal: number;
  duracionTotal: number;
  pasos: PasoDijkstra[];   // para visualización en tiempo real
}

export interface PasoDijkstra {
  tipo: 'visitar' | 'relajar' | 'finalizado';
  nodo: string;
  desde?: string;
  distancia: number;
  distancias: Record<string, number>;
}

// ── Buses ───────────────────────────────────────────────────
export type EstadoBus = 'disponible' | 'en_ruta' | 'mantenimiento' | 'fuera_servicio';

export interface Bus {
  id: string;
  placa: string;
  capacidad: number;
  empresa: string | null;
  estado: EstadoBus;
}

// ── Despachos (cola de prioridad) ───────────────────────────
export type Urgencia = 'normal' | 'alta' | 'critica';
export type EstadoDespacho = 'pendiente' | 'en_plataforma' | 'despachado' | 'cancelado';

export interface Despacho {
  id: string;
  bus_id: string;
  ruta_id: string;
  hora_programada: string;
  prioridad: number;
  urgencia: Urgencia;
  estado: EstadoDespacho;
  plataforma_num: number | null;
  pasajeros: number;
  notas: string | null;
  created_at: string;
  despachado_at: string | null;
}

export interface DespachoDetalle extends Despacho {
  bus_placa: string;
  bus_empresa: string | null;
  origen_nombre: string;
  dest_nombre: string;
  distancia_km: number;
}

// ── WebSocket eventos ───────────────────────────────────────
export type WsEvento =
  | { tipo: 'dijkstra_paso';  payload: PasoDijkstra }
  | { tipo: 'despacho_nuevo'; payload: DespachoDetalle }
  | { tipo: 'despacho_update';payload: DespachoDetalle }
  | { tipo: 'cola_update';    payload: DespachoDetalle[] };
