import { query, pool } from '../utils/db';
import type { Despacho, DespachoDetalle, Urgencia, EstadoDespacho } from '../models/types';

// Peso de urgencia para calcular prioridad efectiva
const URGENCIA_PESO: Record<Urgencia, number> = {
  normal:  0,
  alta:   10,
  critica: 20,
};

// Prioridad efectiva: menor número = mayor prioridad en la cola
// Se calcula como: (10 - prioridad_base) - urgencia_peso + minutos_hasta_salida
export function calcularPrioridadEfectiva(
  despacho: Pick<Despacho, 'prioridad' | 'urgencia' | 'hora_programada'>
): number {
  const ahora = Date.now();
  const salida = new Date(despacho.hora_programada).getTime();
  const minutosRestantes = Math.max(0, (salida - ahora) / 60000);
  const base = (10 - despacho.prioridad) - URGENCIA_PESO[despacho.urgencia];
  return base + minutosRestantes * 0.1;
}

// Obtener la cola ordenada desde PostgreSQL
export async function obtenerCola(): Promise<DespachoDetalle[]> {
  const rows = await query<DespachoDetalle>(`
    SELECT
      d.*,
      b.placa   AS bus_placa,
      b.empresa AS bus_empresa,
      co.nombre AS origen_nombre,
      cd.nombre AS dest_nombre,
      r.distancia_km
    FROM despachos d
    JOIN buses    b  ON b.id = d.bus_id
    JOIN rutas    r  ON r.id = d.ruta_id
    JOIN ciudades co ON co.id = r.ciudad_origen_id
    JOIN ciudades cd ON cd.id = r.ciudad_dest_id
    WHERE d.estado IN ('pendiente', 'en_plataforma')
    ORDER BY
      CASE d.urgencia WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 ELSE 2 END,
      d.prioridad DESC,
      d.hora_programada ASC
  `);
  return rows;
}

// Crear un nuevo despacho
export async function crearDespacho(data: {
  bus_id: string;
  ruta_id: string;
  hora_programada: string;
  prioridad: number;
  urgencia: Urgencia;
  plataforma_num?: number;
  pasajeros?: number;
  notas?: string;
}): Promise<DespachoDetalle> {
  const [row] = await query<{ id: string }>(`
    INSERT INTO despachos (bus_id, ruta_id, hora_programada, prioridad, urgencia, plataforma_num, pasajeros, notas)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id
  `, [
    data.bus_id, data.ruta_id, data.hora_programada,
    data.prioridad, data.urgencia,
    data.plataforma_num ?? null,
    data.pasajeros ?? 0,
    data.notas ?? null,
  ]);

  const [detalle] = await query<DespachoDetalle>(`
    SELECT d.*, b.placa AS bus_placa, b.empresa AS bus_empresa,
           co.nombre AS origen_nombre, cd.nombre AS dest_nombre, r.distancia_km
    FROM despachos d
    JOIN buses b ON b.id=d.bus_id
    JOIN rutas r ON r.id=d.ruta_id
    JOIN ciudades co ON co.id=r.ciudad_origen_id
    JOIN ciudades cd ON cd.id=r.ciudad_dest_id
    WHERE d.id=$1
  `, [row.id]);

  return detalle;
}

// Avanzar estado de un despacho
export async function actualizarEstadoDespacho(
  id: string,
  estado: EstadoDespacho
): Promise<DespachoDetalle | null> {
  const extras = estado === 'despachado'
    ? ', despachado_at = NOW()'
    : '';

  await pool.query(
    `UPDATE despachos SET estado=$1${extras} WHERE id=$2`,
    [estado, id]
  );

  const rows = await query<DespachoDetalle>(`
    SELECT d.*, b.placa AS bus_placa, b.empresa AS bus_empresa,
           co.nombre AS origen_nombre, cd.nombre AS dest_nombre, r.distancia_km
    FROM despachos d
    JOIN buses b ON b.id=d.bus_id
    JOIN rutas r ON r.id=d.ruta_id
    JOIN ciudades co ON co.id=r.ciudad_origen_id
    JOIN ciudades cd ON cd.id=r.ciudad_dest_id
    WHERE d.id=$1
  `, [id]);

  return rows[0] ?? null;
}
