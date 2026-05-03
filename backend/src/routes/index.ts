import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  validate, schemaCiudad, schemaRuta, schemaTrayecto,
  schemaDespacho, schemaEstadoDespacho, schemaBus,
} from '../middleware/validate';
import { getCiudades, getRutas, getGrafo, calcularTrayecto, crearCiudad, crearRuta } from '../controllers/rutas.controller';
import { getCola, postDespacho, patchEstadoDespacho, getHistorial } from '../controllers/despachos.controller';
import { getBuses, getBusById, crearBus, actualizarEstadoBus, eliminarBus } from '../controllers/buses.controller';
import { getEstadisticas } from '../controllers/estadisticas.controller';

const router = Router();

router.get('/estadisticas',            asyncHandler(getEstadisticas));
router.get('/ciudades',                asyncHandler(getCiudades));
router.post('/ciudades',               validate(schemaCiudad),          asyncHandler(crearCiudad));
router.get('/rutas',                   asyncHandler(getRutas));
router.post('/rutas',                  validate(schemaRuta),             asyncHandler(crearRuta));
router.get('/grafo',                   asyncHandler(getGrafo));
router.post('/trayecto',               validate(schemaTrayecto),         asyncHandler(calcularTrayecto));
router.get('/buses',                   asyncHandler(getBuses));
router.get('/buses/:id',               asyncHandler(getBusById));
router.post('/buses',                  validate(schemaBus),              asyncHandler(crearBus));
router.patch('/buses/:id/estado',      asyncHandler(actualizarEstadoBus));
router.delete('/buses/:id',            asyncHandler(eliminarBus));
router.get('/despachos/cola',          asyncHandler(getCola));
router.get('/despachos/historial',     asyncHandler(getHistorial));
router.post('/despachos',              validate(schemaDespacho),         asyncHandler(postDespacho));
router.patch('/despachos/:id/estado',  validate(schemaEstadoDespacho),   asyncHandler(patchEstadoDespacho));

export default router;
