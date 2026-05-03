export interface Ciudad {
  id: string;
  nombre: string;
  codigo: string;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
}

export interface Ruta {
  id: string;
  ciudad_origen_id: string;
  ciudad_dest_id: string;
  distancia_km: number;
  duracion_min: number;
  origen_nombre: string;
  dest_nombre: string;
}

export interface Vecino {
  ciudadId: string;
  nombre: string;
  distanciaKm: number;
  duracionMin: number;
  rutaId: string;
}

export type ListaAdyacencia = Record<string, Vecino[]>;

export interface ResultadoDijkstra {
  ruta: string[];
  rutaIds: string[];
  distanciaTotal: number;
  duracionTotal: number;
  pasos: PasoDijkstra[];
}

export interface PasoDijkstra {
  tipo: 'visitar' | 'relajar' | 'finalizado';
  nodo: string;
  desde?: string;
  distancia: number;
  distancias: Record<string, number>;
}

export type Urgencia = 'normal' | 'alta' | 'critica';
export type EstadoDespacho = 'pendiente' | 'en_plataforma' | 'despachado' | 'cancelado';
export type EstadoBus = 'disponible' | 'en_ruta' | 'mantenimiento' | 'fuera_servicio';

export interface Bus {
  id: string;
  placa: string;
  capacidad: number;
  empresa: string | null;
  estado: EstadoBus;
}

export interface DespachoDetalle {
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
  bus_placa: string;
  bus_empresa: string | null;
  origen_nombre: string;
  dest_nombre: string;
  distancia_km: number;
}

export type WsEvento =
  | { tipo: 'conectado';       mensaje: string }
  | { tipo: 'dijkstra_paso';   payload: PasoDijkstra }
  | { tipo: 'despacho_nuevo';  payload: DespachoDetalle }
  | { tipo: 'despacho_update'; payload: DespachoDetalle }
  | { tipo: 'cola_update';     payload: DespachoDetalle[] };
