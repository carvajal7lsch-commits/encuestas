import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  Zap, 
  Database, 
  LayoutDashboard, 
  Download, 
  CheckCircle2, 
  Server, 
  ClipboardList, 
  X,
  Layers,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showApkModal, setShowApkModal] = useState(false);

  // Garantizar que al cargar o recargar la página SIEMPRE se posicione arriba en el tope (0, 0)
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="landing-container">
      {/* Hero Wrapper with Dark Gradient */}
      <div className="hero-dark-wrapper">
        {/* Ambient Background Glows */}
        <div className="glow-blob glow-blob-1"></div>

        {/* Top Navigation Bar */}
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

        {/* Hero Section */}
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
            <button className="btn-hero-primary" onClick={() => setShowApkModal(true)}>
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
      </div>

      {/* Light Background Content Sections */}
      <div className="light-content-wrapper">
        {/* Section 1: Features Grid */}
        <section id="caracteristicas" className="section-container">
          <div className="section-header">
            <h2>Pilares del Sistema</h2>
            <p className="hide-on-mobile">Arquitectura robusta diseñada para encuestadores en territorio rural</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box icon-emerald">
                <Smartphone size={22} />
              </div>
              <div className="feature-card-text">
                <h3>App Offline-First</h3>
                <p>
                  Kotlin, Compose y Room. <span className="hide-on-mobile">Captura sin señal y encola el envío con WorkManager.</span>
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-purple">
                <Zap size={22} />
              </div>
              <div className="feature-card-text">
                <h3>Smart Merge Engine</h3>
                <p>
                  Fusión campo por campo. <span className="hide-on-mobile">Evita sobrescribir datos si dos personas editan al mismo ciudadano.</span>
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-blue">
                <ShieldCheck size={22} />
              </div>
              <div className="feature-card-text">
                <h3>Seguridad Inmutable</h3>
                <p>
                  Historial append-only en BD <span className="hide-on-mobile">gestionado por triggers para auditoría transparente.</span>
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-amber">
                <LayoutDashboard size={22} />
              </div>
              <div className="feature-card-text">
                <h3>Dashboard Web</h3>
                <p>
                  Panel para resolver conflictos, <span className="hide-on-mobile">monitorear encuestadores y exportar consolidados.</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Smart Merge Diagram */}
        <section id="smartmerge" className="section-container smartmerge-section">
          <div className="smartmerge-box">
            <div className="smartmerge-content">
              <div className="section-tag-row">
                <Layers size={14} />
                <span>TECNOLOGÍA CORE</span>
              </div>
              <h2>Resolución Inteligente de Conflictos</h2>
              <p>
                Si dos encuestadores registran al mismo ciudadano desconectados a diferentes horas, 
                el backend integra únicamente los cambios nuevos de manera atómica.
              </p>
              <ul className="smartmerge-list">
                <li>
                  <CheckCircle2 size={16} className="list-icon" />
                  <span><strong>Fusión Atributo por Atributo:</strong> Preserva datos de ambos encuestadores.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="list-icon" />
                  <span><strong>Auditoría Completa (log_conflictos):</strong> Historial inmutable de estados.</span>
                </li>
              </ul>
            </div>
            <div className="smartmerge-visual">
              <div className="visual-badge">Smart Merge Core</div>
              <div className="visual-row">
                <div className="visual-chip chip-enc1">
                  <Smartphone size={14} /> Encuestador A (Offline)
                </div>
                <div className="visual-arrow">➔</div>
                <div className="visual-chip chip-server">
                  <Zap size={14} /> Strategy Pattern
                </div>
              </div>
              <div className="visual-row">
                <div className="visual-chip chip-enc2">
                  <Smartphone size={14} /> Encuestador B (Offline)
                </div>
                <div className="visual-arrow">➔</div>
                <div className="visual-chip chip-db">
                  <Database size={14} /> PostgreSQL
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
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
      </div>

      {/* Modal Download APK */}
      {showApkModal && (
        <div className="modal-backdrop" onClick={() => setShowApkModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <Smartphone size={22} color="#2563eb" />
                <h3>Descargar App Móvil</h3>
              </div>
              <button className="modal-close" onClick={() => setShowApkModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Instala la aplicación nativa Android para captura de encuestas sin conexión.</p>
              
              <div className="apk-info-box">
                <div className="info-row">
                  <span className="info-label">Archivo:</span>
                  <span className="info-value">EncuestasOffline-v1.0.apk</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Compatibilidad:</span>
                  <span className="info-value">Android 8.0+ (API 26)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Seguridad:</span>
                  <span className="info-value">Cifrado SQLCipher</span>
                </div>
              </div>

              <a 
                href="/EncuestasOffline-v1.0.apk" 
                download="EncuestasOffline-v1.0.apk" 
                className="btn-modal-download"
                onClick={() => {
                  alert("Descargando paquete de instalación APK...");
                  setShowApkModal(false);
                }}
              >
                <Download size={18} />
                <span>Descargar APK (v1.0)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
