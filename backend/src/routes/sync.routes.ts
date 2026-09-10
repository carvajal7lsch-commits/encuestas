import { Router } from 'express';
import { syncEncuesta, buscarPersona } from '../controllers/sync.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requiereRol } from '../middlewares/rolMiddleware';

const router = Router();

// La app de campo la usan los encuestadores; el rol se comprueba igual, para
// que un token con un rol que no existe no pase.
const EN_CAMPO = requiereRol('encuestador', 'supervisor', 'admin');

// Consulta de UNA persona por documento. Deliberadamente no hay listado: un
// celular de campo no tiene por que llevar encima el censo entero.
router.get('/personas/:documento', authMiddleware, EN_CAMPO, buscarPersona);

// Endpoint para sincronizacion individual
router.post('/encuestas', authMiddleware, EN_CAMPO, syncEncuesta);

export default router;
