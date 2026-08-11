import React from 'react';
import { Smartphone, Zap, ShieldCheck, LayoutDashboard } from 'lucide-react';
import './LandingFeatures.css';

const LandingFeatures: React.FC = () => {
  return (
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
  );
};

export default LandingFeatures;
