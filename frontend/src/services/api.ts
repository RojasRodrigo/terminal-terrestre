import axios from 'axios';
import type { Ciudad, Ruta, Bus, DespachoDetalle, ResultadoDijkstra, ListaAdyacencia, Urgencia } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  timeout: 10000,
});

// ── Red ──────────────────────────────────────────────────────
export const getCiudades = () => api.get<Ciudad[]>('/ciudades').then(r => r.data);
export const getRutas    = () => api.get<Ruta[]>('/rutas').then(r => r.data);
export const getGrafo    = () => api.get<ListaAdyacencia>('/grafo').then(r => r.data);

export const calcularTrayecto = (
  origen_id: string,
  destino_id: string,
  optimizar: 'distancia' | 'duracion' = 'distancia'
) =>
  api.post<ResultadoDijkstra>('/trayecto', { origen_id, destino_id, optimizar }).then(r => r.data);

export const crearCiudad = (data: { nombre: string; codigo: string; latitud?: number; longitud?: number }) =>
  api.post<Ciudad>('/ciudades', data).then(r => r.data);

export const crearRuta = (data: {
  ciudad_origen_id: string; ciudad_dest_id: string;
  distancia_km: number; duracion_min: number;
}) => api.post<Ruta>('/rutas', data).then(r => r.data);

// ── Buses y despachos ────────────────────────────────────────
export const getBuses   = () => api.get<Bus[]>('/buses').then(r => r.data);
export const getCola    = () => api.get<DespachoDetalle[]>('/despachos/cola').then(r => r.data);
export const getHistorial = () => api.get<DespachoDetalle[]>('/despachos/historial').then(r => r.data);

export const crearDespacho = (data: {
  bus_id: string; ruta_id: string; hora_programada: string;
  prioridad?: number; urgencia?: Urgencia;
  plataforma_num?: number; pasajeros?: number; notas?: string;
}) => api.post<DespachoDetalle>('/despachos', data).then(r => r.data);

export const actualizarEstado = (id: string, estado: string) =>
  api.patch<DespachoDetalle>(`/despachos/${id}/estado`, { estado }).then(r => r.data);

export default api;
