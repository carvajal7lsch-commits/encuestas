import { Router } from 'express';
import {
    getDashboardStats, getConflictLogs, downloadCsvReport,
    getPersonas, getUsuarios, createUsuario, toggleUsuario, getHistorialPersona, getSeriesDiaria,
    updateUsuario, resetPasswordUsuario, deleteUsuario
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requiereRol } from '../middlewares/rolMiddleware';

const router = Router();

// Toda ruta de admin exige token valido...
router.use(authMiddleware);
// ...y ademas un rol con permiso. Antes bastaba el token: un encuestador podia
// leer el consolidado entero y crearse una cuenta de administrador.
const PUEDE_CONSULTAR = requiereRol('admin', 'supervisor');
const SOLO_ADMIN = requiereRol('admin');

// Consulta: el supervisor tambien la necesita para hacer su trabajo.
router.get('/stats', PUEDE_CONSULTAR, getDashboardStats);
router.get('/series', PUEDE_CONSULTAR, getSeriesDiaria);
router.get('/conflictos', PUEDE_CONSULTAR, getConflictLogs);
router.get('/reporte.csv', PUEDE_CONSULTAR, downloadCsvReport);
router.get('/personas', PUEDE_CONSULTAR, getPersonas);
router.get('/personas/:documento/historial', PUEDE_CONSULTAR, getHistorialPersona);
router.get('/usuarios', PUEDE_CONSULTAR, getUsuarios);

// Gestion de cuentas: solo administradores. Un supervisor que pudiera crear
// usuarios podria fabricarse un admin, que es justo lo que se esta cerrando.
router.post('/usuarios', SOLO_ADMIN, createUsuario);
router.put('/usuarios/:id', SOLO_ADMIN, updateUsuario);
router.put('/usuarios/:id/toggle', SOLO_ADMIN, toggleUsuario);
router.put('/usuarios/:id/password', SOLO_ADMIN, resetPasswordUsuario);
router.delete('/usuarios/:id', SOLO_ADMIN, deleteUsuario);

export default router;
