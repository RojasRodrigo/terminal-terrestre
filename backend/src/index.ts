import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initWebSocket } from './utils/websocket';
import { pool } from './utils/db';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api', router);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB]  PostgreSQL conectado');
  } catch (e) {
    console.error('[DB]  Error de conexión:', e);
  }
  console.log(`[API] http://localhost:${PORT}`);
  console.log(`[WS]  ws://localhost:${PORT}/ws`);
});
