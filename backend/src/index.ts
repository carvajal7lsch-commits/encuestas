import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import syncRoutes from './routes/sync.routes';
import { authMiddleware } from './middlewares/authMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
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

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
