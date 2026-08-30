import React from 'react';
import {
  Smartphone,
  ArrowRight,
  WifiOff,
  ShieldCheck,
  CloudUpload,
  Check,
  RefreshCw,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { revealDelay } from '../../hooks/useScrollReveal';
import './LandingHero.css';

interface LandingHeroProps {
  onDownloadApk: () => void;
}

const TECH_STACK = ['Kotlin', 'Jetpack Compose', 'Room + SQLCipher', 'WorkManager', 'Node.js', 'PostgreSQL'];

const LandingHero: React.FC<LandingHeroProps> = ({ onDownloadApk }) => {
  return (
    <section className="hero-section">
      <div className="l-container hero-grid">
        {/* ---------- Columna de mensaje ---------- */}
        <div className="hero-copy">
          <h1 className="hero-title l-reveal" style={revealDelay(0)}>
            Encuestas de campo que <span className="l-gradient-text">no dependen de la señal</span>
          </h1>

          <p className="hero-description l-reveal" style={revealDelay(120)}>
            El encuestador captura en zona rural sin una barra de cobertura. Los datos se guardan
            cifrados en el dispositivo y, al volver la red, el <strong>Smart Merge</strong> los
            fusiona campo por campo sin sobrescribir el trabajo de nadie.
          </p>

          <div className="hero-cta-group l-reveal" style={revealDelay(180)}>
            <button className="l-btn l-btn--primary" onClick={onDownloadApk}>
              <Smartphone size={18} />
              <span>Descargar APK</span>
              <ArrowRight size={16} />
            </button>
            <a className="l-btn l-btn--ghost" href="#como-funciona">
              <PlayCircle size={18} />
              <span>Ver cómo funciona</span>
            </a>
          </div>

          <ul className="hero-trust l-reveal" style={revealDelay(240)}>
            <li>
              <ShieldCheck size={15} /> Cifrado SQLCipher
            </li>
            <li>
              <Smartphone size={15} /> Android 8.0+
            </li>
            <li>
              <CloudUpload size={15} /> Sincronización automática
            </li>
          </ul>
        </div>

        {/* ---------- Mockup del dispositivo ---------- */}
        <div className="hero-device l-reveal" style={revealDelay(160)}>
          <div className="device-glow" aria-hidden="true" />

          <div className="device-frame" role="img" aria-label="Vista previa de la aplicación móvil capturando una encuesta sin conexión">
            <div className="device-notch" aria-hidden="true" />
            <div className="device-screen">
              <div className="app-statusbar">
                <span>9:41</span>
                <span className="app-status-icons">
                  <WifiOff size={11} />
                  <span className="app-battery" />
                </span>
              </div>

              <div className="app-topbar">
                <span className="app-topbar-title">Nueva encuesta</span>
                <span className="pill-offline">
                  <WifiOff size={10} /> Sin conexión
                </span>
              </div>

              <div className="app-body">
                <div className="app-field">
                  <span className="app-field-label">Documento</span>
                  <span className="app-field-value">1.014.882.376</span>
                </div>
                <div className="app-field">
                  <span className="app-field-label">Nombre completo</span>
                  <span className="app-field-value">María Fernanda Ortiz</span>
                </div>
                <div className="app-field app-field--split">
                  <span className="app-field-label">Vereda</span>
                  <span className="app-field-value">El Salado</span>
                </div>

                <div className="app-saved">
                  <Check size={13} /> Guardado en el dispositivo
                </div>

                <div className="app-queue">
                  <div className="app-queue-head">
                    <span>
                      <Clock size={12} /> Cola de sincronización
                    </span>
                    <span className="app-queue-count">3</span>
                  </div>
                  <div className="app-queue-row">
                    <RefreshCw size={12} className="spin-slow" />
                    <span>Encuesta #128</span>
                    <em>enviando</em>
                  </div>
                  <div className="app-queue-row">
                    <Clock size={12} />
                    <span>Encuesta #129</span>
                    <em>en espera</em>
                  </div>
                  <div className="app-queue-row is-done">
                    <Check size={12} />
                    <span>Encuesta #127</span>
                    <em>fusionada</em>
                  </div>
                  <div className="app-queue-bar">
                    <span />
                  </div>
                </div>
              </div>

              <div className="app-fab">Guardar encuesta</div>
            </div>
          </div>

          <div className="device-chip device-chip--merge">
            <RefreshCw size={13} /> Smart Merge aplicado
          </div>
          <div className="device-chip device-chip--secure">
            <ShieldCheck size={13} /> 0 datos perdidos
          </div>
        </div>
      </div>

      {/* ---------- Franja de tecnologías ---------- */}
      <div className="l-container hero-stack l-reveal">
        <span className="hero-stack-label">Construido con</span>
        <div className="hero-stack-list">
          {TECH_STACK.map((tech) => (
            <span key={tech} className="hero-stack-item">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
