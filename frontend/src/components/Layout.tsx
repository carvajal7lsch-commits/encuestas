import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Download,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { IconButton } from './ui';
import Logo from './ui/Logo';
import { cerrarSesion, leerUsuario } from '../services/sesion';
import './ui/panel-theme.css';
import estilos from './Layout.module.css';

/**
 * El APK se distribuye como asset de un GitHub Release (ver
 * scripts/publicar-apk.ps1). Esta URL siempre apunta a la ultima publicada.
 */
const APK_URL =
  'https://github.com/carvajal7lsch-commits/encuestas/releases/latest/download/EncuestasOffline.apk';

/**
 * Tres secciones, no cinco.
 *
 * Reportes era una pantalla entera para descargar un CSV: ahora es un boton
 * dentro de Operacion. Personas y Auditoria Conflictos miraban los mismos
 * registros desde dos angulos distintos y obligaban a saltar de una a otra
 * para responder una sola pregunta; son una.
 */
const ENLACES = [
  { a: '/dashboard', icono: LayoutDashboard, texto: 'Resumen' },
  { a: '/operacion', icono: ClipboardList, texto: 'Operación' },
  { a: '/usuarios', icono: Users, texto: 'Encuestadores' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const usuario = leerUsuario();
  const nombre = usuario.nombre_completo || usuario.nombre || 'Administrador';
  const rol = usuario.rol || 'admin';

  // Al navegar en movil, el panel lateral debe cerrarse solo.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // El tema del panel solo vive mientras el panel esta montado: el login y la
  // landing conservan el suyo. Mismo patron que usa LandingPage.
  useEffect(() => {
    document.documentElement.classList.add('is-panel');
    return () => document.documentElement.classList.remove('is-panel');
  }, []);

  const salir = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className={estilos.contenedor}>
      <IconButton
        etiqueta={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        className={estilos.hamburguesa}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
        aria-expanded={menuAbierto}
      >
        {menuAbierto ? <X size={18} /> : <Menu size={18} />}
      </IconButton>

      {menuAbierto && (
        <div
          className={estilos.velo}
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${estilos.barra} ${menuAbierto ? estilos.abierta : ''}`}>
        <button
          type="button"
          className={estilos.marca}
          onClick={() => navigate('/')}
          aria-label="Ir a la página de inicio"
        >
          <Logo tamano={26} />
        </button>

        <nav className={estilos.navegacion} aria-label="Secciones del panel">
          {ENLACES.map(({ a, icono: Icono, texto }) => (
            <NavLink
              key={a}
              to={a}
              className={({ isActive }) =>
                `${estilos.enlace} ${isActive ? estilos.activo : ''}`
              }
            >
              <Icono size={17} aria-hidden="true" />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className={estilos.pie}>
          <a className={estilos.descarga} href={APK_URL} rel="noopener">
            <Download size={16} aria-hidden="true" />
            <span>Descargar App</span>
          </a>

          <div className={estilos.usuario}>
            <span className={estilos.avatar} aria-hidden="true">
              {nombre.charAt(0).toUpperCase()}
            </span>
            <span className={estilos.datosUsuario}>
              <span className={estilos.nombre} title={nombre}>{nombre}</span>
              <span className={estilos.rol}>{rol}</span>
            </span>
          </div>

          <button
            type="button"
            className={estilos.salir}
            onClick={salir}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className={estilos.contenido}>
        <Outlet />
      </main>
    </div>
  );
}
