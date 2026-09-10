import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { guardarSesion } from '../services/sesion';
import { Modal, Mosaico } from '../components/ui';
import Logo from '../components/ui/Logo';
import estilos from './LoginPage.module.css';

/** Administrador de prueba creado por el seed del backend (scripts/seedUsers.ts). */
const DEMO_USUARIO = 'admin';
// No usar una clave incluida en filtraciones conocidas: los navegadores la
// marcan como comprometida aunque la base de datos la guarde con bcrypt.
const DEMO_PASSWORD = 'SenaEncuestas_2026!';

export default function LoginPage() {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const navigate = useNavigate();
  const idCampo = useId();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.login(documento, password);
      // "Recuérdame" ahora decide de verdad: marcado deja la sesión en
      // localStorage, sin marcar vive solo mientras la pestaña esté abierta.
      guardarSesion(res.token, res.usuario, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas o usuario inactivo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={estilos.contenedor}>
      {/* Columna izquierda: el mosaico hace de puente con la landing oscura. */}
      <div className={estilos.lateral}>
        <div className={estilos.obra}>
          <Mosaico />
        </div>

        <div className={estilos.pieLateral}>
          <h2>Encuestas que no dependen de la señal</h2>
          <p>
            Captura en campo sin conexión, fusión campo por campo cuando dos versiones
            chocan y auditoría de cada sincronización.
          </p>
        </div>
      </div>

      {/* Columna derecha: el formulario. */}
      <div className={estilos.columnaForm}>
        <div className={estilos.formulario}>
          <button
            type="button"
            className={estilos.marca}
            onClick={() => navigate('/')}
            aria-label="Ir a la página de inicio"
          >
            <Logo tamano={28} />
          </button>

          <div className={estilos.titulo}>
            <h1>Iniciar sesión</h1>
            <p>Panel de administración. Usa la cuenta que te asignó tu supervisor.</p>
          </div>

          <form onSubmit={handleLogin} className={estilos.campos}>
            {error && (
              <div className={estilos.alerta} role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className={estilos.campo}>
              <label htmlFor={`${idCampo}-documento`}>Documento o correo</label>
              <input
                id={`${idCampo}-documento`}
                type="text"
                autoComplete="username"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="1001001"
                required
              />
            </div>

            <div className={estilos.campo}>
              <label htmlFor={`${idCampo}-password`}>Contraseña</label>
              <div className={estilos.campoPassword}>
                <input
                  id={`${idCampo}-password`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className={estilos.verPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className={estilos.opciones}>
              <label className={estilos.recordar}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Recuérdame</span>
              </label>
              <button
                type="button"
                className={estilos.olvide}
                onClick={() => setAyudaAbierta(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className={estilos.enviar} disabled={isLoading}>
              {isLoading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>

          {/* Antes esto era una caja con borde punteado, título propio y su
              botón: pesaba tanto como el formulario y competía con el CTA.
              Es una nota de cortesía, así que ocupa una línea. */}
          <p className={estilos.demo}>
            <span className={estilos.demoEtiqueta}>Acceso de prueba</span>
            <code>{DEMO_USUARIO}</code>
            <span className={estilos.demoSep}>/</span>
            <code>{DEMO_PASSWORD}</code>
            <button
              type="button"
              className={estilos.demoUsar}
              onClick={() => {
                setDocumento(DEMO_USUARIO);
                setPassword(DEMO_PASSWORD);
                setError('');
              }}
            >
              Rellenar
            </button>
          </p>

          <div className={estilos.pie}>
            <button type="button" className={estilos.volver} onClick={() => navigate('/')}>
              <ArrowLeft size={15} />
              <span>Volver al inicio</span>
            </button>
          </div>
        </div>
      </div>

      {ayudaAbierta && (
        <Modal
          titulo="Recuperar el acceso"
          onCerrar={() => setAyudaAbierta(false)}
          ancho="sm"
        >
          <p>
            El restablecimiento de contraseñas de administración no se hace desde esta
            pantalla. Solicítalo a la mesa de soporte técnico indicando tu número de
            documento; un supervisor puede reasignarte la contraseña desde{' '}
            <strong>Encuestadores</strong>.
          </p>
        </Modal>
      )}
    </div>
  );
}
