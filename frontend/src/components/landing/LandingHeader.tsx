import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Lock } from 'lucide-react';
import './LandingHeader.css';

const LandingHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="landing-header">
      <div className="landing-nav-content">
        <div className="landing-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">
            <ClipboardList size={20} color="#ffffff" />
          </div>
          <div className="brand-text-box">
            <span className="brand-title">Encuestas<span className="brand-title-alt">Offline</span></span>
            <span className="brand-badge">Sistema de Salud en Campo</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#caracteristicas">Características</a>
          <a href="#smartmerge">Smart Merge</a>
        </nav>

        <div className="landing-header-actions">
          <button className="btn-admin-login" onClick={() => navigate('/login')}>
            <Lock size={16} />
            <span><span className="hide-on-mobile">Acceso </span>Admin<span className="hide-on-mobile">istrador</span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
