import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import request from 'supertest';
import app from '../index';
import { AuthService } from '../services/AuthService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { SesionRepository } from '../repositories/SesionRepository';
import { Usuario } from '../types/auth.types';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
let usuario: Usuario;
let crear: jest.SpyInstance;
let obtener: jest.SpyInstance;
let revocar: jest.SpyInstance;

beforeEach(async () => {
  usuario = { id_usuario: 8, numero_documento: '111111', nombre_completo: 'Encuestador',
    email: null, password_hash: await bcrypt.hash('una-clave-de-prueba', 4),
    rol: 'encuestador', dispositivo_id: null, activo: true, creado_en: new Date() };
  jest.spyOn(UsuarioRepository.prototype, 'obtenerPorCredencial').mockResolvedValue(usuario);
  crear = jest.spyOn(SesionRepository.prototype, 'crear').mockResolvedValue(undefined);
  obtener = jest.spyOn(SesionRepository.prototype, 'obtener').mockResolvedValue(null);
  revocar = jest.spyOn(SesionRepository.prototype, 'revocar').mockResolvedValue(undefined);
});

test('login móvil persiste solo la huella de una credencial aleatoria, con vencimiento de 30 días', async () => {
  const res = await request(app).post('/api/auth/login').send({ identificador: '111111',
    password: 'una-clave-de-prueba', sesion_persistente: true });
  expect(res.status).toBe(200);
  expect(res.body.refreshToken).toMatch(/^[a-f0-9]{64}$/);
  expect(crear).toHaveBeenCalledWith(hash(res.body.refreshToken), 8, hash(usuario.password_hash), expect.any(Date));
  expect(Date.parse(res.body.refreshExpiresAt) - Date.now()).toBeGreaterThan(29 * 86400000);
  const access = jwt.verify(res.body.token, process.env.JWT_SECRET || 'fallback_secret') as jwt.JwtPayload;
  expect(access.exp! - access.iat!).toBe(8 * 3600);
  expect(() => jwt.verify(res.body.refreshToken, process.env.JWT_SECRET || 'fallback_secret')).toThrow();
});

test('login anterior conserva su contrato y no crea sesiones persistentes', async () => {
  const res = await new AuthService().login('111111', 'una-clave-de-prueba');
  expect(res?.token).toBeDefined();
  expect(res?.refreshToken).toBeUndefined();
  expect(crear).not.toHaveBeenCalled();
});

test('credenciales incorrectas nunca crean una sesión de renovación', async () => {
  expect(await new AuthService().login('111111', 'incorrecta', true)).toBeNull();
  expect(crear).not.toHaveBeenCalled();
});

test('renueva con el rol actual sin cambiar la credencial de renovación', async () => {
  obtener.mockResolvedValue({ ...usuario, rol: 'supervisor', password_fingerprint: hash(usuario.password_hash) });
  const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'a'.repeat(64) });
  expect(res.status).toBe(200);
  const access = jwt.verify(res.body.token, process.env.JWT_SECRET || 'fallback_secret') as jwt.JwtPayload;
  expect(access.rol).toBe('supervisor');
  expect(crear).not.toHaveBeenCalled();
});

test('una sesión expirada, revocada o de usuario inactivo no renueva', async () => {
  const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'b'.repeat(64) });
  expect(res.status).toBe(401);
  expect(res.body.token).toBeUndefined();
});

test('cambiar la contraseña invalida la renovación anterior', async () => {
  obtener.mockResolvedValue({ ...usuario, password_fingerprint: hash('hash-anterior') });
  expect(await new AuthService().refresh('c'.repeat(64))).toBeNull();
});

test('logout revoca la credencial por su huella y es idempotente', async () => {
  const token = 'd'.repeat(64);
  expect((await request(app).post('/api/auth/logout').send({ refreshToken: token })).status).toBe(204);
  expect((await request(app).post('/api/auth/logout').send({ refreshToken: token })).status).toBe(204);
  expect(revocar).toHaveBeenCalledWith(hash(token));
});

test('un JWT de acceso no sirve para renovar y los fallos del servidor no devuelven 401', async () => {
  expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'eyJ.jwt.token' })).status).toBe(400);
  obtener.mockRejectedValue(new Error('database unavailable'));
  expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'e'.repeat(64) })).status).toBe(500);
});
