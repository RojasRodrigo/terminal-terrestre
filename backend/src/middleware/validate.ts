import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        detalles: result.error.errors.map(e => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Schemas de validación ─────────────────────────────────────

export const schemaCiudad = z.object({
  nombre:   z.string().min(2).max(100),
  codigo:   z.string().min(2).max(10),
  latitud:  z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});

export const schemaRuta = z.object({
  ciudad_origen_id: z.string().uuid(),
  ciudad_dest_id:   z.string().uuid(),
  distancia_km:     z.number().int().positive(),
  duracion_min:     z.number().int().positive(),
});

export const schemaTrayecto = z.object({
  origen_id:  z.string().uuid(),
  destino_id: z.string().uuid(),
  optimizar:  z.enum(['distancia', 'duracion']).optional().default('distancia'),
});

export const schemaDespacho = z.object({
  bus_id:          z.string().uuid(),
  ruta_id:         z.string().uuid(),
  hora_programada: z.string().datetime({ offset: true }).or(z.string().min(1)),
  prioridad:       z.number().int().min(1).max(10).optional().default(5),
  urgencia:        z.enum(['normal', 'alta', 'critica']).optional().default('normal'),
  plataforma_num:  z.number().int().positive().optional(),
  pasajeros:       z.number().int().min(0).optional().default(0),
  notas:           z.string().max(500).optional(),
});

export const schemaEstadoDespacho = z.object({
  estado: z.enum(['pendiente', 'en_plataforma', 'despachado', 'cancelado']),
});

export const schemaBus = z.object({
  placa:     z.string().min(3).max(20),
  capacidad: z.number().int().positive().max(200).optional().default(40),
  empresa:   z.string().max(100).optional(),
});
