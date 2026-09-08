import { Router } from 'express';
import { 
    getDashboardStats, getConflictLogs, downloadCsvReport,
    getPersonas, getUsuarios, createUsuario, toggleUsuario, getHistorialPersona
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de admin estarán protegidas
router.use(authMiddleware);

router.get('/stats', getDashboardStats);
router.get('/conflictos', getConflictLogs);
router.get('/reporte.csv', downloadCsvReport);

router.get('/personas', getPersonas);
router.get('/personas/:documento/historial', getHistorialPersona);
router.get('/usuarios', getUsuarios);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id/toggle', toggleUsuario);

export default router;
