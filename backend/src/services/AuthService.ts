import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { SesionRepository } from '../repositories/SesionRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { JwtPayload, Usuario } from '../types/auth.types';

export class AuthService {
  private usuarioRepository: UsuarioRepository;
  private sesionRepository = new SesionRepository();
  private hash(valor: string) { return createHash('sha256').update(valor).digest('hex'); }

  private emitirToken(usuario: Usuario) {
    const payload: JwtPayload = {
      id_usuario: usuario.id_usuario,
      numero_documento: usuario.numero_documento,
      rol: usuario.rol
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });
  }

  async refresh(refreshToken: string) {
    const usuario = await this.sesionRepository.obtener(this.hash(refreshToken));
    if (!usuario || usuario.password_fingerprint !== this.hash(usuario.password_hash)) return null;
    return { token: this.emitirToken(usuario) };
  }

  async logout(refreshToken: string) {
    await this.sesionRepository.revocar(this.hash(refreshToken));
  }

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
  }

  async login(identificador: string, passwordPlana: string, persistente = false) {
    const usuario = await this.usuarioRepository.obtenerPorCredencial(identificador);

    if (!usuario) {
      return null;
    }

    const passwordValida = await bcrypt.compare(passwordPlana, usuario.password_hash);
    if (!passwordValida) {
      return null;
    }

    const token = this.emitirToken(usuario);
    let sesion: { refreshToken: string; refreshExpiresAt: string } | undefined;
    if (persistente) {
      const refreshToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await this.sesionRepository.crear(this.hash(refreshToken), usuario.id_usuario,
        this.hash(usuario.password_hash), expiresAt);
      sesion = { refreshToken, refreshExpiresAt: expiresAt.toISOString() };
    }

    return {
      token,
      ...sesion,
      usuario: {
        id_usuario: usuario.id_usuario,
        numero_documento: usuario.numero_documento,
        rol: usuario.rol
      }
    };
  }
}
