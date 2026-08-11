import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import syncRoutes from './routes/sync.routes';
import { authMiddleware } from './middlewares/authMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

console.log('[CORS] Orígenes permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como apps móviles o curl)
    if (!origin) {
      return callback(null, true);
    }
    // Permitir dinámicamente cualquier origen local en desarrollo
    const esLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (esLocal || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false); // Rechazar sin arrojar error a Express
  },
  credentials: true
}));
app.use(express.json());

// Rutas públicas
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

import adminRoutes from './routes/admin.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);

// Ruta protegida de prueba
app.get('/api/protected', authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Has accedido a una ruta protegida', 
    user: (req as any).user 
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
  });
}

export default app;
