import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';

const loginSchema = z.object({
  identificador: z.string().min(1, 'El identificador es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

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

    const { identificador, password } = parseResult.data;
    const resultado = await this.authService.login(identificador, password);

    if (!resultado) {
      res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });
      return;
    }

    res.status(200).json({
      token: resultado.token,
      usuario: resultado.usuario
    });
  } catch (error) {
    console.error('Error en AuthController.login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
}
