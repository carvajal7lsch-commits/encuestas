import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, FileSpreadsheet, Users, FileText, Download, ServerCog, LogOut } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { nombre: 'Ana Supervisor', rol: 'Admin' };

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
          <button className="btn-download-apk" onClick={() => alert('Descargando APK Móvil EncuestasOffline...')}>
            <Download size={20} />
            <span>Descargar App</span>
          </button>
          
          <div className="user-profile-box">
            <div className="user-profile">
              <div className="avatar">{user.nombre ? user.nombre.charAt(0).toUpperCase() : 'A'}</div>
              <div className="user-details">
                <span className="user-name">{user.nombre || 'Ana Supervisor'}</span>
                <span className="user-role">{user.rol || 'Admin'}</span>
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
