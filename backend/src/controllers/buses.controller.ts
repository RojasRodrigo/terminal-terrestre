import { Request, Response } from 'express';
import { query, pool } from '../utils/db';
import type { Bus, EstadoBus } from '../models/types';

// GET /api/buses
export async function getBuses(_req: Request, res: Response): Promise<void> {
  const rows = await query<Bus>(
    'SELECT * FROM buses ORDER BY placa'
  );
  res.json(rows);
}

// GET /api/buses/:id
export async function getBusById(req: Request, res: Response): Promise<void> {
  const rows = await query<Bus>('SELECT * FROM buses WHERE id=$1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Bus no encontrado' }); return; }
  res.json(rows[0]);
}

// POST /api/buses
export async function crearBus(req: Request, res: Response): Promise<void> {
  const { placa, capacidad = 40, empresa } = req.body as {
    placa: string; capacidad?: number; empresa?: string;
  };
  const [row] = await query<Bus>(
    'INSERT INTO buses (placa, capacidad, empresa) VALUES ($1,$2,$3) RETURNING *',
    [placa.toUpperCase(), capacidad, empresa ?? null]
  );
  res.status(201).json(row);
}

// PATCH /api/buses/:id/estado
export async function actualizarEstadoBus(req: Request, res: Response): Promise<void> {
  const { estado } = req.body as { estado: EstadoBus };
  const valid: EstadoBus[] = ['disponible','en_ruta','mantenimiento','fuera_servicio'];
  if (!valid.includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' }); return;
  }
  await pool.query('UPDATE buses SET estado=$1 WHERE id=$2', [estado, req.params.id]);
  const rows = await query<Bus>('SELECT * FROM buses WHERE id=$1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Bus no encontrado' }); return; }
  res.json(rows[0]);
}

// DELETE /api/buses/:id  (soft: marca fuera_servicio)
export async function eliminarBus(req: Request, res: Response): Promise<void> {
  await pool.query(
    "UPDATE buses SET estado='fuera_servicio' WHERE id=$1",
    [req.params.id]
  );
  res.json({ mensaje: 'Bus marcado como fuera de servicio' });
}
