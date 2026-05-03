import { Request, Response } from 'express';
import { obtenerCola, crearDespacho, actualizarEstadoDespacho } from '../services/cola.service';
import { query } from '../utils/db';
import { broadcast } from '../utils/websocket';
import type { Urgencia, EstadoDespacho } from '../models/types';

// GET /api/despachos/cola
export async function getCola(_req: Request, res: Response): Promise<void> {
  const cola = await obtenerCola();
  res.json(cola);
}

// GET /api/buses
export async function getBuses(_req: Request, res: Response): Promise<void> {
  const rows = await query('SELECT * FROM buses ORDER BY placa');
  res.json(rows);
}

// POST /api/despachos
export async function postDespacho(req: Request, res: Response): Promise<void> {
  const {
    bus_id, ruta_id, hora_programada,
    prioridad = 5, urgencia = 'normal',
    plataforma_num, pasajeros, notas,
  } = req.body as {
    bus_id: string; ruta_id: string; hora_programada: string;
    prioridad?: number; urgencia?: Urgencia;
    plataforma_num?: number; pasajeros?: number; notas?: string;
  };

  if (!bus_id || !ruta_id || !hora_programada) {
    res.status(400).json({ error: 'bus_id, ruta_id y hora_programada son requeridos' });
    return;
  }

  const detalle = await crearDespacho({
    bus_id, ruta_id, hora_programada,
    prioridad, urgencia, plataforma_num, pasajeros, notas,
  });

  broadcast({ tipo: 'despacho_nuevo', payload: detalle });

  const colaActualizada = await obtenerCola();
  broadcast({ tipo: 'cola_update', payload: colaActualizada });

  res.status(201).json(detalle);
}

// PATCH /api/despachos/:id/estado
export async function patchEstadoDespacho(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { estado } = req.body as { estado: EstadoDespacho };

  const estadosValidos: EstadoDespacho[] = ['pendiente','en_plataforma','despachado','cancelado'];
  if (!estadosValidos.includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  const detalle = await actualizarEstadoDespacho(id, estado);
  if (!detalle) {
    res.status(404).json({ error: 'Despacho no encontrado' });
    return;
  }

  broadcast({ tipo: 'despacho_update', payload: detalle });

  const colaActualizada = await obtenerCola();
  broadcast({ tipo: 'cola_update', payload: colaActualizada });

  res.json(detalle);
}

// GET /api/despachos/historial
export async function getHistorial(_req: Request, res: Response): Promise<void> {
  const rows = await query(`
    SELECT d.*, b.placa AS bus_placa, b.empresa AS bus_empresa,
           co.nombre AS origen_nombre, cd.nombre AS dest_nombre
    FROM despachos d
    JOIN buses b ON b.id=d.bus_id
    JOIN rutas r ON r.id=d.ruta_id
    JOIN ciudades co ON co.id=r.ciudad_origen_id
    JOIN ciudades cd ON cd.id=r.ciudad_dest_id
    WHERE d.estado IN ('despachado','cancelado')
    ORDER BY d.despachado_at DESC
    LIMIT 100
  `);
  res.json(rows);
}
