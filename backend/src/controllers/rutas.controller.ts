import { Request, Response } from 'express';
import { construirGrafo, dijkstra } from '../services/dijkstra.service';
import { broadcast } from '../utils/websocket';
import { query, pool } from '../utils/db';

// GET /api/ciudades
export async function getCiudades(_req: Request, res: Response): Promise<void> {
  const rows = await query('SELECT * FROM ciudades WHERE activo=TRUE ORDER BY nombre');
  res.json(rows);
}

// GET /api/rutas
export async function getRutas(_req: Request, res: Response): Promise<void> {
  const rows = await query(`
    SELECT r.*, co.nombre AS origen_nombre, cd.nombre AS dest_nombre
    FROM rutas r
    JOIN ciudades co ON co.id=r.ciudad_origen_id
    JOIN ciudades cd ON cd.id=r.ciudad_dest_id
    WHERE r.activo=TRUE ORDER BY co.nombre, cd.nombre
  `);
  res.json(rows);
}

// GET /api/grafo  — lista de adyacencia completa
export async function getGrafo(_req: Request, res: Response): Promise<void> {
  const grafo = await construirGrafo();
  res.json(grafo);
}

// POST /api/trayecto  — calcula ruta óptima con Dijkstra
export async function calcularTrayecto(req: Request, res: Response): Promise<void> {
  const { origen_id, destino_id, optimizar = 'distancia' } = req.body as {
    origen_id: string;
    destino_id: string;
    optimizar?: 'distancia' | 'duracion';
  };

  if (!origen_id || !destino_id) {
    res.status(400).json({ error: 'origen_id y destino_id son requeridos' });
    return;
  }

  const grafo = await construirGrafo();

  // Mapa id → nombre para mostrar en la respuesta
  const ciudades = await query<{ id: string; nombre: string }>(
    'SELECT id, nombre FROM ciudades WHERE activo=TRUE'
  );
  const nombresPorId: Record<string, string> = {};
  ciudades.forEach(c => { nombresPorId[c.id] = c.nombre; });

  const usarDuracion = optimizar === 'duracion';
  const resultado = dijkstra(grafo, origen_id, destino_id, nombresPorId, usarDuracion);

  // Transmitir pasos por WebSocket para visualización en tiempo real
  resultado.pasos.forEach((paso, i) => {
    setTimeout(() => {
      broadcast({ tipo: 'dijkstra_paso', payload: paso });
    }, i * 120);
  });

  // Persistir en historial
  if (resultado.rutaIds.length > 0) {
    await pool.query(
      `INSERT INTO trayectos (ciudad_origen_id, ciudad_dest_id, ruta_calculada, distancia_total, duracion_total, algoritmo)
       VALUES ($1,$2,$3,$4,$5,'dijkstra')`,
      [
        origen_id, destino_id,
        JSON.stringify(resultado.rutaIds),
        resultado.distanciaTotal,
        resultado.duracionTotal,
      ]
    );
  }

  res.json(resultado);
}

// POST /api/ciudades
export async function crearCiudad(req: Request, res: Response): Promise<void> {
  const { nombre, codigo, latitud, longitud } = req.body as {
    nombre: string; codigo: string; latitud?: number; longitud?: number;
  };
  const [row] = await query(
    'INSERT INTO ciudades (nombre,codigo,latitud,longitud) VALUES ($1,$2,$3,$4) RETURNING *',
    [nombre, codigo.toUpperCase(), latitud ?? null, longitud ?? null]
  );
  res.status(201).json(row);
}

// POST /api/rutas
export async function crearRuta(req: Request, res: Response): Promise<void> {
  const { ciudad_origen_id, ciudad_dest_id, distancia_km, duracion_min } = req.body as {
    ciudad_origen_id: string; ciudad_dest_id: string;
    distancia_km: number; duracion_min: number;
  };
  const [row] = await query(
    'INSERT INTO rutas (ciudad_origen_id,ciudad_dest_id,distancia_km,duracion_min) VALUES ($1,$2,$3,$4) RETURNING *',
    [ciudad_origen_id, ciudad_dest_id, distancia_km, duracion_min]
  );
  res.status(201).json(row);
}
