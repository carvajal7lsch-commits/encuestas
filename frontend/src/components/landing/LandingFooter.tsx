import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Lock } from 'lucide-react';
import './LandingFooter.css';

interface LandingFooterProps {
  onDownloadApk: () => void;
}

const SECTION_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#caracteristicas', label: 'Características' },
  { href: '#smartmerge', label: 'Smart Merge' },
  { href: '#arquitectura', label: 'Arquitectura' },
  { href: '#faq', label: 'Preguntas frecuentes' },
];

const LandingFooter: React.FC<LandingFooterProps> = ({ onDownloadApk }) => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="l-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-brand-row">
              <span className="brand-icon">
                <ClipboardList size={18} strokeWidth={2.2} />
              </span>
              <span className="brand-title">
                Encuestas<span className="brand-title-alt">Offline</span>
              </span>
            </span>
            <p>
              Sistema de encuestas con captura offline y sincronización inteligente para
              equipos que trabajan donde la señal no llega.
            </p>
          </div>

          <nav className="footer-col" aria-label="Secciones del sitio">
            <h4>Producto</h4>
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="footer-col">
            <h4>Acceso</h4>
            <button type="button" onClick={onDownloadApk}>
              Descargar APK
            </button>
            <button type="button" onClick={() => navigate('/login')}>
              Panel de administración
            </button>
          </div>

          <div className="footer-col">
            <h4>Proyecto</h4>
            <span className="footer-static">SENA · Análisis y Desarrollo de Software</span>
            <span className="footer-static">Ficha 3142784</span>
            <span className="footer-static">Licencia MIT</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} EncuestasOffline. Todos los derechos reservados.</span>
          <button className="footer-admin-link" onClick={() => navigate('/login')}>
            <Lock size={13} /> Acceso administrador
          </button>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
