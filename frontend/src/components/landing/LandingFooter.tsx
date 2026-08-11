import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import './LandingFooter.css';

const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div>
          <strong>EncuestasOffline</strong> — Captura y Auditoría de Salud en Campo
        </div>
        <div className="footer-links">
          <span onClick={() => navigate('/login')} className="footer-admin-link">
            <Lock size={13} /> Acceso Administrador
          </span>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
