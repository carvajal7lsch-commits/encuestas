import React from 'react';
import {
  Smartphone,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  Check,
} from 'lucide-react';
import { revealDelay } from '../../hooks/useScrollReveal';
import './LandingFeatures.css';

const FEATURES = [
  {
    icon: Smartphone,
    tone: 'emerald',
    wide: true,
    title: 'App Android offline-first',
    text: 'Kotlin y Jetpack Compose sobre una base de datos local cifrada. El encuestador crea, edita y valida encuestas completas con el modo avión activado.',
    bullets: ['Validación en el dispositivo', 'Base local cifrada', 'Sin pantallas de error por red'],
  },
  {
    icon: Zap,
    tone: 'violet',
    wide: false,
    title: 'Smart Merge Engine',
    text: 'Fusión campo por campo con Strategy Pattern: dos encuestadores pueden tocar al mismo ciudadano sin que nadie pierda su aporte.',
    bullets: [],
  },
  {
    icon: ShieldCheck,
    tone: 'blue',
    wide: false,
    title: 'Historial inmutable',
    text: 'Los triggers de PostgreSQL escriben un histórico append-only. Nada se borra: cada cambio queda con autor, fecha y valor anterior.',
    bullets: [],
  },
  {
    icon: LayoutDashboard,
    tone: 'amber',
    wide: true,
    title: 'Panel web de administración',
    text: 'Resuelve conflictos pendientes, supervisa el avance de cada encuestador y exporta el consolidado sin salir del navegador.',
    bullets: ['Bandeja de conflictos', 'Gestión de usuarios', 'Reportes exportables'],
  },
];

const LandingFeatures: React.FC = () => {
  return (
    <section id="caracteristicas" className="l-section features-section">
      <div className="l-container">
        <div className="l-section-head l-section-head--center l-reveal">
          <span className="l-eyebrow">
            <Sparkles size={13} /> Características
          </span>
          <h2>Los cuatro pilares del sistema</h2>
          <p>
            Arquitectura pensada para el territorio rural: primero el dispositivo, después la red y
            siempre con trazabilidad.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className={`feature-card l-reveal${f.wide ? ' feature-card--wide' : ''}`}
                style={revealDelay(i * 90)}
              >
                <span className={`feature-icon-box tone-${f.tone}`}>
                  <Icon size={21} />
                </span>
                <div className="feature-card-text">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  {f.bullets.length > 0 && (
                    <ul className="feature-bullets">
                      {f.bullets.map((b) => (
                        <li key={b}>
                          <Check size={13} /> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
