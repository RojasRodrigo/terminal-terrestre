import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import type { WsEvento } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setCola, upsertDespacho, addPasoDijkstra, setWsConectado } = useStore();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConectado(true);
        console.log('[WS] conectado');
      };

      ws.onmessage = (e: MessageEvent<string>) => {
        const evento = JSON.parse(e.data) as WsEvento;
        switch (evento.tipo) {
          case 'cola_update':
            setCola(evento.payload);
            break;
          case 'despacho_nuevo':
          case 'despacho_update':
            upsertDespacho(evento.payload);
            break;
          case 'dijkstra_paso':
            addPasoDijkstra(evento.payload);
            break;
        }
      };

      ws.onclose = () => {
        setWsConectado(false);
        console.log('[WS] desconectado — reintentando en 3s');
        setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);
}
