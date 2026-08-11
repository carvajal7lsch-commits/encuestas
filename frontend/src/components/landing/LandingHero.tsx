import React from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Database, 
  Server, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import './LandingHero.css';

interface LandingHeroProps {
  onDownloadApk: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onDownloadApk }) => {
  return (
    <section className="hero-section">
      <h1 className="hero-title">
        Encuestas de Salud <span className="hide-on-mobile">en Campo</span> <br />
        <span className="hero-title-highlight">100% Offline <span className="hide-on-mobile">con Smart Merge</span></span>
      </h1>

      <p className="hero-description">
        Captura <span className="hide-on-mobile">ininterrumpida de</span> encuestas sin internet. 
        Sincronización inteligente <span className="hide-on-mobile">atributo por atributo</span> sin pérdida de datos.
      </p>

      {/* Hero CTA Button: Descargar APK en el centro */}
      <div className="hero-cta-group">
        <button className="btn-hero-primary" onClick={onDownloadApk}>
          <Smartphone size={18} />
          <span>Descargar App<span className="hide-on-mobile"> Android (APK)</span></span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* System Highlights Ribbon */}
      <div className="hero-stats-ribbon">
        <div className="stat-item">
          <div className="stat-icon-wrapper"><Database size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">Room + SQLCipher</div>
            <div className="stat-label">Cifrado Local SQLite</div>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-icon-wrapper"><Zap size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">Smart Merge Engine</div>
            <div className="stat-label">Fusión por Atributo</div>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-icon-wrapper"><ShieldCheck size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">PostgreSQL</div>
            <div className="stat-label">Auditoría por Triggers</div>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-icon-wrapper"><Server size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">React + Node.js</div>
            <div className="stat-label">Panel Auditoría Web</div>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow Indicator */}
      <div className="scroll-indicator-container">
        <a href="#caracteristicas" className="hero-scroll-down-btn" aria-label="Desplazar hacia abajo">
          <span>Ver características</span>
          <ChevronDown size={16} className="bounce-arrow" />
        </a>
      </div>
    </section>
  );
};

export default LandingHero;
