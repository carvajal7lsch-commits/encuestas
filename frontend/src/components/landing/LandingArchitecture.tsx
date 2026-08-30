import React from 'react';
import { Boxes, Smartphone, Server, Database, MonitorCog } from 'lucide-react';
import { revealDelay } from '../../hooks/useScrollReveal';
import './LandingArchitecture.css';

const LAYERS = [
  {
    icon: Smartphone,
    tone: 'emerald',
    label: 'Capa móvil',
    title: 'App Android nativa',
    stack: ['Kotlin', 'Jetpack Compose', 'Room + SQLCipher', 'WorkManager', 'Retrofit'],
  },
  {
    icon: Server,
    tone: 'blue',
    label: 'Capa de servicios',
    title: 'API REST',
    stack: ['Node.js', 'Express', 'TypeScript', 'JWT', 'Smart Merge Engine'],
  },
  {
    icon: Database,
    tone: 'violet',
    label: 'Capa de datos',
    title: 'PostgreSQL',
    stack: ['Triggers de auditoría', 'Histórico append-only', 'log_conflictos'],
  },
  {
    icon: MonitorCog,
    tone: 'amber',
    label: 'Capa de administración',
    title: 'Dashboard web',
    stack: ['React', 'Vite', 'TypeScript', 'Reportes'],
  },
];

const LandingArchitecture: React.FC = () => {
  return (
    <section id="arquitectura" className="l-section arch-section">
      <div className="l-container">
        <div className="l-section-head l-section-head--center l-reveal">
          <span className="l-eyebrow">
            <Boxes size={13} /> Arquitectura
          </span>
          <h2>Cuatro capas, una sola fuente de verdad</h2>
          <p>
            Cada capa resuelve un problema distinto y se comunica por contratos explícitos, de modo
            que el modo offline nunca compromete la integridad del dato final.
          </p>
        </div>

        <div className="arch-flow">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div key={layer.title} className={`arch-card l-reveal tone-${layer.tone}`} style={revealDelay(i * 90)}>
                <span className="arch-icon">
                  <Icon size={19} />
                </span>
                <span className="arch-label">{layer.label}</span>
                <h3>{layer.title}</h3>
                <ul>
                  {layer.stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingArchitecture;
