import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getEstadisticas(_req: Request, res: Response): Promise<void> {
  const [resumen] = await query<{
    total_ciudades: string;
    total_rutas: string;
    total_buses: string;
    buses_disponibles: string;
    despachos_hoy: string;
    despachos_pendientes: string;
    despachos_criticos: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM ciudades WHERE activo=TRUE)::text                          AS total_ciudades,
      (SELECT COUNT(*) FROM rutas    WHERE activo=TRUE)::text                          AS total_rutas,
      (SELECT COUNT(*) FROM buses)::text                                               AS total_buses,
      (SELECT COUNT(*) FROM buses WHERE estado='disponible')::text                    AS buses_disponibles,
      (SELECT COUNT(*) FROM despachos WHERE DATE(created_at)=CURRENT_DATE)::text      AS despachos_hoy,
      (SELECT COUNT(*) FROM despachos WHERE estado IN ('pendiente','en_plataforma'))::text AS despachos_pendientes,
      (SELECT COUNT(*) FROM despachos WHERE estado IN ('pendiente','en_plataforma') AND urgencia='critica')::text AS despachos_criticos
  `);

  // Top rutas más usadas
  const topRutas = await query<{
    origen: string; destino: string; total: string;
  }>(`
    SELECT
      co.nombre AS origen,
      cd.nombre AS destino,
      COUNT(d.id)::text AS total
    FROM despachos d
    JOIN rutas    r  ON r.id=d.ruta_id
    JOIN ciudades co ON co.id=r.ciudad_origen_id
    JOIN ciudades cd ON cd.id=r.ciudad_dest_id
    WHERE d.estado='despachado'
    GROUP BY co.nombre, cd.nombre
    ORDER BY COUNT(d.id) DESC
    LIMIT 5
  `);

  // Despachos por hora (últimas 24h)
  const porHora = await query<{ hora: string; total: string }>(`
    SELECT
      DATE_TRUNC('hour', hora_programada)::text AS hora,
      COUNT(*)::text AS total
    FROM despachos
    WHERE hora_programada >= NOW() - INTERVAL '24 hours'
    GROUP BY hora
    ORDER BY hora
  `);

  res.json({
    resumen: {
      totalCiudades:       Number(resumen.total_ciudades),
      totalRutas:          Math.floor(Number(resumen.total_rutas) / 2),
      totalBuses:          Number(resumen.total_buses),
      busesDisponibles:    Number(resumen.buses_disponibles),
      despachosDia:        Number(resumen.despachos_hoy),
      despachosPendientes: Number(resumen.despachos_pendientes),
      despachosCriticos:   Number(resumen.despachos_criticos),
    },
    topRutas: topRutas.map(r => ({
      origen: r.origen, destino: r.destino, total: Number(r.total),
    })),
    despachosPorHora: porHora.map(h => ({
      hora: h.hora, total: Number(h.total),
    })),
  });
}
