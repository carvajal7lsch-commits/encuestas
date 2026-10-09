import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';

const loginSchema = z.object({
  identificador: z.string().min(1, 'El identificador es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  sesion_persistente: z.boolean().optional()
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  refresh = async (req: Request, res: Response): Promise<void> => {
    const datos = z.object({ refreshToken: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(req.body);
    if (!datos.success) { res.status(400).json({ error: 'Credencial de renovación inválida' }); return; }
    try {
      const sesion = await this.authService.refresh(datos.data.refreshToken);
      if (!sesion) { res.status(401).json({ error: 'Inicia sesión nuevamente para enviar tus encuestas' }); return; }
      res.status(200).json(sesion);
    } catch {
      res.status(500).json({ error: 'No se pudo renovar la sesión' });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const datos = z.object({ refreshToken: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(req.body);
    if (!datos.success) { res.status(400).json({ error: 'Credencial inválida' }); return; }
    try {
      await this.authService.logout(datos.data.refreshToken);
      res.status(204).end();
    } catch {
      res.status(500).json({ error: 'No se pudo cerrar la sesión en el servidor' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        detalles: parseResult.error.format()
      });
      return;
    }

    const { identificador, password, sesion_persistente } = parseResult.data;
    const resultado = await this.authService.login(identificador, password, sesion_persistente);

    if (!resultado) {
      res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });
      return;
    }

    res.status(200).json({
      token: resultado.token,
      usuario: resultado.usuario,
      ...(resultado.refreshToken ? {
        refreshToken: resultado.refreshToken,
        refreshExpiresAt: resultado.refreshExpiresAt
      } : {})
    });
  } catch (error) {
    console.error('Error en AuthController.login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
}
