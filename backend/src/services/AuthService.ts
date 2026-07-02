import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { JwtPayload } from '../types/auth.types';

export class AuthService {
  private usuarioRepository: UsuarioRepository;

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
  }

  async login(identificador: string, passwordPlana: string): Promise<string | null> {
    const usuario = await this.usuarioRepository.obtenerPorCredencial(identificador);
    
    if (!usuario) {
      return null;
    }

    const passwordValida = await bcrypt.compare(passwordPlana, usuario.password_hash);
    if (!passwordValida) {
      return null;
    }

    const payload: JwtPayload = {
      id_usuario: usuario.id_usuario,
      numero_documento: usuario.numero_documento,
      rol: usuario.rol
    };

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    return token;
  }
}
