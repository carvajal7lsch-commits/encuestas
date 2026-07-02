import { Router } from 'express';
import { syncEncuesta } from '../controllers/sync.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint para sincronización individual
router.post('/encuestas', authMiddleware, syncEncuesta);

export default router;
