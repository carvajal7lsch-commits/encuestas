import React from 'react';
import { Layers, CheckCircle2, Smartphone, Zap, Database } from 'lucide-react';
import './SmartMergeInfo.css';

const SmartMergeInfo: React.FC = () => {
  return (
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
  );
};

export default SmartMergeInfo;
