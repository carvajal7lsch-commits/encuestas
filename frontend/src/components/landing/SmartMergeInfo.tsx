import React from 'react';
import { Layers, CheckCircle2, Smartphone, Zap, Database, ArrowDown, WifiOff } from 'lucide-react';
import { revealDelay } from '../../hooks/useScrollReveal';
import './SmartMergeInfo.css';

const BENEFITS = [
  {
    title: 'Fusión atributo por atributo',
    text: 'Se comparan campos individuales, no registros completos. Lo que A no tocó, B no lo sobrescribe.',
  },
  {
    title: 'Resolución por estrategia',
    text: 'Cada tipo de campo define su regla de resolución mediante Strategy Pattern, sin condicionales anidados.',
  },
  {
    title: 'Rastro en log_conflictos',
    text: 'Toda fusión deja registro del valor previo, el valor entrante y la decisión aplicada.',
  },
];

const SmartMergeInfo: React.FC = () => {
  return (
    <section id="smartmerge" className="l-section smartmerge-section">
      <div className="l-container smartmerge-grid">
        {/* ---- Explicación ---- */}
        <div className="smartmerge-content">
          <div className="l-section-head l-reveal">
            <span className="l-eyebrow">
              <Layers size={13} /> Tecnología core
            </span>
            <h2>
              Dos encuestadores, un mismo ciudadano, <span className="l-gradient-text">cero datos perdidos</span>
            </h2>
            <p>
              El caso difícil del trabajo en campo: dos personas registran al mismo ciudadano
              desconectadas, a horas distintas. El servidor no elige un ganador — integra lo nuevo de
              cada una de forma atómica.
            </p>
          </div>

          <ul className="smartmerge-list">
            {BENEFITS.map((b, i) => (
              <li key={b.title} className="l-reveal" style={revealDelay(i * 90)}>
                <CheckCircle2 size={17} className="list-icon" />
                <div>
                  <strong>{b.title}</strong>
                  <span>{b.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Diagrama ---- */}
        <div className="smartmerge-visual l-reveal" style={revealDelay(120)}>
          <div className="merge-inputs">
            <div className="merge-node node-a">
              <header>
                <span className="merge-who">
                  <Smartphone size={13} /> Encuestador A
                </span>
                <span className="merge-when">
                  <WifiOff size={10} /> 09:12
                </span>
              </header>
              <div className="merge-field">
                <span>Teléfono</span>
                <b>300 555 11 20</b>
              </div>
            </div>

            <div className="merge-node node-b">
              <header>
                <span className="merge-who">
                  <Smartphone size={13} /> Encuestador B
                </span>
                <span className="merge-when">
                  <WifiOff size={10} /> 14:40
                </span>
              </header>
              <div className="merge-field">
                <span>Dirección</span>
                <b>Vereda El Salado, lote 4</b>
              </div>
            </div>
          </div>

          <div className="merge-arrow" aria-hidden="true">
            <ArrowDown size={16} />
          </div>

          <div className="merge-engine">
            <Zap size={16} />
            <div>
              <strong>Smart Merge Engine</strong>
              <span>Resolución por estrategia</span>
            </div>
          </div>

          <div className="merge-arrow" aria-hidden="true">
            <ArrowDown size={16} />
          </div>

          <div className="merge-output">
            <header>
              <span className="merge-who">
                <Database size={13} /> Registro consolidado
              </span>
              <span className="merge-tag">PostgreSQL</span>
            </header>
            <div className="merge-field merge-field--keep">
              <span>Nombre</span>
              <b>María F. Ortiz</b>
              <em>sin cambios</em>
            </div>
            <div className="merge-field merge-field--from-a">
              <span>Teléfono</span>
              <b>300 555 11 20</b>
              <em>de A</em>
            </div>
            <div className="merge-field merge-field--from-b">
              <span>Dirección</span>
              <b>Vereda El Salado, lote 4</b>
              <em>de B</em>
            </div>
            <footer>log_conflictos · +1 evento auditado</footer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartMergeInfo;
