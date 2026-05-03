import { create } from 'zustand';
import type { DespachoDetalle, PasoDijkstra, Ciudad, Ruta } from '@/types';

interface AppState {
  // Datos de red
  ciudades: Ciudad[];
  rutas: Ruta[];
  setCiudades: (c: Ciudad[]) => void;
  setRutas: (r: Ruta[]) => void;

  // Cola de despachos
  cola: DespachoDetalle[];
  setCola: (cola: DespachoDetalle[]) => void;
  upsertDespacho: (d: DespachoDetalle) => void;

  // Visualización Dijkstra
  pasosDijkstra: PasoDijkstra[];
  addPasoDijkstra: (p: PasoDijkstra) => void;
  clearPasos: () => void;

  // WebSocket
  wsConectado: boolean;
  setWsConectado: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  ciudades: [],
  rutas: [],
  setCiudades: (ciudades) => set({ ciudades }),
  setRutas: (rutas) => set({ rutas }),

  cola: [],
  setCola: (cola) => set({ cola }),
  upsertDespacho: (d) =>
    set((s) => ({
      cola: s.cola.some((x) => x.id === d.id)
        ? s.cola.map((x) => (x.id === d.id ? d : x))
        : [...s.cola, d],
    })),

  pasosDijkstra: [],
  addPasoDijkstra: (p) =>
    set((s) => ({ pasosDijkstra: [...s.pasosDijkstra, p] })),
  clearPasos: () => set({ pasosDijkstra: [] }),

  wsConectado: false,
  setWsConectado: (wsConectado) => set({ wsConectado }),
}));
