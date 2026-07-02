import { useState } from 'react';
import { Calendar, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import './ReportesPage.css';

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('conflictos');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await api.downloadReport();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Generación de Reportes</h1>
          <p className="page-subtitle">Exporta los datos sincronizados y conflictos a formato CSV</p>
        </div>
      </header>

      <div className="report-content">
        <div className="report-config glass-panel">
          <div className="config-section">
            <h3>1. Tipo de Reporte</h3>
            <div className="radio-group">
              <label className={`radio-card ${tipoReporte === 'conflictos' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="conflictos" 
                  checked={tipoReporte === 'conflictos'}
                  onChange={(e) => setTipoReporte(e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-title">Conflictos Resueltos</span>
                  <span className="radio-desc">Auditoría completa de los datos cruzados por el Smart Merge</span>
                </div>
              </label>

              <label className={`radio-card ${tipoReporte === 'nuevos' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="nuevos" 
                  checked={tipoReporte === 'nuevos'}
                  onChange={(e) => setTipoReporte(e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-title">Registros Nuevos</span>
                  <span className="radio-desc">Solo personas creadas por primera vez en el campo</span>
                </div>
              </label>

              <label className={`radio-card ${tipoReporte === 'completo' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="completo" 
                  checked={tipoReporte === 'completo'}
                  onChange={(e) => setTipoReporte(e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-title">Volcado Completo</span>
                  <span className="radio-desc">Base de datos ciudadana completa actualizada</span>
                </div>
              </label>
            </div>
          </div>

          <div className="config-section">
            <h3>2. Rango de Fechas</h3>
            <div className="date-inputs">
              <div className="input-group">
                <label>Desde</label>
                <div className="date-field">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" defaultValue="2026-07-01" />
                </div>
              </div>
              <div className="input-group">
                <label>Hasta</label>
                <div className="date-field">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" defaultValue="2026-07-31" />
                </div>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button 
              className={`btn-primary btn-large ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCcw className="spinner" size={20} />
                  Generando CSV...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={20} />
                  Generar Reporte CSV
                </>
              )}
            </button>
          </div>
        </div>

        <div className="recent-reports glass-panel" style={{ marginTop: '20px' }}>
          <h3>Reportes de Sistema</h3>
          <p className="text-muted">El archivo CSV generado contiene la última versión actualizada de la base de datos de encuestados junto con la resolución de conflictos (Smart Merge).</p>
        </div>
      </div>
    </div>
  );
}
