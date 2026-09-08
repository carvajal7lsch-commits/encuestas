import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, FileSpreadsheet, Users, FileText, Download, ServerCog, LogOut, LayoutDashboard } from 'lucide-react';
import './Layout.css';

/** Nombre del APK publicado en frontend/public por scripts/publicar-apk.ps1. */
const APK_FILE = 'EncuestasOffline.apk';

interface UsuarioSesion {
  nombre_completo?: string;
  nombre?: string;
  rol?: string;
}

const leerUsuario = (): UsuarioSesion => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') as UsuarioSesion;
  } catch {
    return {};
  }
};

export default function Layout() {
  const navigate = useNavigate();
  // El backend devuelve nombre_completo; se aceptan ambas formas para no
  // depender de datos de ejemplo quemados en el código.
  const user = leerUsuario();
  const nombre = user.nombre_completo || user.nombre || 'Administrador';
  const rol = user.rol || 'admin';

  const handleLogout = () => {
    if (window.confirm('¿Está seguro de que desea cerrar la sesión de administración?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <ServerCog className="logo-icon" size={28} />
          <h2 className="logo-text">Encuestas<span>Offline</span></h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Resumen</span>
          </NavLink>
          <NavLink to="/personas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Personas</span>
          </NavLink>
          <NavLink to="/conflictos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={20} />
            <span>Auditoría Conflictos</span>
          </NavLink>
          <NavLink to="/reportes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet size={20} />
            <span>Reportes</span>
          </NavLink>
          <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Gestión Usuarios</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {/* Descarga real del APK servido por el propio sitio. */}
          <a className="btn-download-apk" href={`/${APK_FILE}`} download={APK_FILE}>
            <Download size={20} />
            <span>Descargar App</span>
          </a>
          
          <div className="user-profile-box">
            <div className="user-profile">
              <div className="avatar">{nombre.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name" title={nombre}>{nombre}</span>
                <span className="user-role">{rol}</span>
              </div>
            </div>
            
            <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
