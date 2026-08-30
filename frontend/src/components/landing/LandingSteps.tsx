import React from 'react';
import { PenLine, ListChecks, GitMerge, Route } from 'lucide-react';
import { revealDelay } from '../../hooks/useScrollReveal';
import './LandingSteps.css';

const STEPS = [
  {
    icon: PenLine,
    title: 'Captura sin señal',
    text: 'El encuestador registra a la persona en terreno. El formulario se guarda cifrado en el dispositivo con Room y SQLCipher, sin depender de una sola barra de cobertura.',
    meta: 'Room · SQLCipher',
  },
  {
    icon: ListChecks,
    title: 'Encola y reintenta',
    text: 'WorkManager mantiene la cola de envíos pendientes y reintenta con backoff exponencial en cuanto el sistema operativo detecta conectividad real.',
    meta: 'WorkManager · Retrofit',
  },
  {
    icon: GitMerge,
    title: 'Fusiona sin pisar datos',
    text: 'El backend aplica Smart Merge atributo por atributo. Si dos encuestadores tocaron al mismo ciudadano, se conservan ambos aportes y queda el rastro auditable.',
    meta: 'Node.js · PostgreSQL',
  },
];

const LandingSteps: React.FC = () => {
  return (
    <section id="como-funciona" className="l-section steps-section">
      <div className="l-container">
        <div className="l-section-head l-section-head--center l-reveal">
          <span className="l-eyebrow">
            <Route size={13} /> Cómo funciona
          </span>
          <h2>De la vereda a la base de datos, en tres pasos</h2>
          <p>
            Todo el recorrido está diseñado para que la falta de internet nunca sea el motivo de un
            dato perdido.
          </p>
        </div>

        <ol className="steps-grid">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="step-card l-reveal" style={revealDelay(i * 110)}>
                <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
                <span className="step-icon">
                  <Icon size={20} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="step-meta">{step.meta}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default LandingSteps;
