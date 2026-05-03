import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { WsEvento } from '../models/types';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: import('http').Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log(`[WS] cliente conectado — ${req.socket.remoteAddress}`);
    ws.send(JSON.stringify({ tipo: 'conectado', mensaje: 'Terminal API en línea' }));

    ws.on('close', () => console.log('[WS] cliente desconectado'));
    ws.on('error', (err) => console.error('[WS] error:', err));
  });

  console.log('[WS] WebSocket server listo en /ws');
}

export function broadcast(evento: WsEvento): void {
  if (!wss) return;
  const msg = JSON.stringify(evento);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}
