import { useState } from 'react';
import { Calendar, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import './ReportesPage.css';

/** Primer dia del mes en curso, en el formato que espera <input type="date">. */
const inicioDeMes = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('completo');
  const [desde, setDesde] = useState(inicioDeMes);
  const [hasta, setHasta] = useState(hoyISO);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const rangoInvalido = Boolean(desde && hasta && desde > hasta);

  const handleGenerate = async () => {
    if (rangoInvalido) return;
    setIsGenerating(true);
    setMensaje('');
    try {
      // Antes estos filtros eran decorativos: siempre se bajaba el mismo volcado.
      await api.downloadReport({ tipo: tipoReporte, desde, hasta });
      setMensaje('Reporte generado y descargado.');
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo generar el reporte');
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
                  <span className="radio-desc">Todas las encuestas sincronizadas en el rango de fechas</span>
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
                  <span className="radio-desc">Solo primeras capturas, sin las actualizaciones posteriores</span>
                </div>
              </label>

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
                  <span className="radio-desc">Solo encuestas que pasaron por el Smart Merge</span>
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
                  <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Hasta</label>
                <div className="date-field">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
                </div>
              </div>
            </div>
            {rangoInvalido && (
              <p className="reporte-aviso reporte-aviso--error">
                La fecha inicial no puede ser posterior a la final.
              </p>
            )}
          </div>

          <div className="action-section">
            <button
              className={`btn-primary btn-large ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating || rangoInvalido}
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
            {mensaje && <p className="reporte-aviso">{mensaje}</p>}
          </div>
        </div>

        <div className="recent-reports glass-panel" style={{ marginTop: '20px' }}>
          <h3>Sobre el archivo generado</h3>
          <p className="text-muted">
            El CSV incluye documento, nombre, fechas de captura y de sincronización, si la
            encuesta fue una actualización y los campos recolectados (vacunas, enfermedad y
            observaciones). Se exportan hasta 5.000 registros por descarga.
          </p>
        </div>
      </div>
    </div>
  );
}
