import { useState, useEffect } from 'react';
import { Search, Clock, Eye, XCircle, GitMerge, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import './PersonasPage.css';

interface Persona {
  numero_documento: string;
  nombres: string;
  apellidos: string;
  municipio: string | null;
  sync_version: number;
  updated_at: string;
}

interface VersionHistorial {
  id_encuesta: string;
  datos_recolectados: Record<string, unknown>;
  fecha_encuesta: string;
  fecha_sincronizacion: string | null;
  es_actualizacion: boolean;
  encuestador: string | null;
  tuvo_conflicto: boolean;
}

interface Historial {
  persona: { numero_documento: string; nombres: string; apellidos: string };
  historial: VersionHistorial[];
}

const formatearFecha = (valor: string | null) => {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? 'Sin fecha' : fecha.toLocaleString();
};

export default function PersonasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Historial inmutable de la persona seleccionada
  const [historial, setHistorial] = useState<Historial | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPersonas();
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener personas');
    } finally {
      setLoading(false);
    }
  };

  const abrirHistorial = async (documento: string) => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    setHistorial(null);
    try {
      setHistorial(await api.getHistorialPersona(documento));
    } catch (err) {
      setErrorHistorial(err instanceof Error ? err.message : 'No se pudo cargar el historial');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cerrarHistorial = () => {
    setHistorial(null);
    setErrorHistorial('');
    setCargandoHistorial(false);
  };

  const termino = searchTerm.trim().toLowerCase();
  const filteredPersonas = personas.filter((p) =>
    String(p?.numero_documento || '').includes(termino) ||
    String(p?.nombres || '').toLowerCase().includes(termino) ||
    String(p?.apellidos || '').toLowerCase().includes(termino)
  );

  const modalAbierto = cargandoHistorial || !!historial || !!errorHistorial;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Directorio de Personas</h1>
          <p className="page-subtitle">Consulta y auditoría de los ciudadanos encuestados</p>
        </div>
        <div className="header-actions">
          <div className="search-bar glass-panel">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por cédula o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-icon glass-panel" onClick={loadPersonas} title="Actualizar" disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombres y Apellidos</th>
              <th>Municipio</th>
              <th>Última Sincronización</th>
              <th className="action-cell">Auditoría</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-message">Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="table-message table-message--error">{error}</td></tr>
            ) : filteredPersonas.length === 0 ? (
              <tr><td colSpan={5} className="table-message">No hay datos registrados</td></tr>
            ) : filteredPersonas.map((persona) => (
              <tr key={persona.numero_documento}>
                <td className="font-mono">{persona.numero_documento}</td>
                <td className="font-medium">{persona.nombres} {persona.apellidos}</td>
                <td>{persona.municipio || 'N/A'}</td>
                <td>
                  <div className="date-cell">
                    <Clock size={14} className="text-muted" />
                    {formatearFecha(persona.updated_at)}
                  </div>
                </td>
                <td className="action-cell">
                  <button
                    className="btn-icon-small"
                    title="Ver historial inmutable"
                    onClick={() => abrirHistorial(persona.numero_documento)}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarHistorial}>
          <div className="modal-content glass-panel historial-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Historial inmutable</h2>
                {historial && (
                  <p className="text-muted">
                    {historial.persona.nombres} {historial.persona.apellidos} · CC {historial.persona.numero_documento}
                  </p>
                )}
              </div>
              <button className="btn-icon-small" onClick={cerrarHistorial} title="Cerrar">
                <XCircle size={22} />
              </button>
            </div>

            <div className="historial-body">
              {cargandoHistorial && <p className="table-message">Cargando historial...</p>}
              {errorHistorial && <p className="table-message table-message--error">{errorHistorial}</p>}

              {historial && historial.historial.length === 0 && (
                <p className="table-message">Esta persona todavía no tiene encuestas sincronizadas.</p>
              )}

              {historial?.historial.map((version, indice) => (
                <article className="historial-item" key={version.id_encuesta}>
                  <div className="historial-item-head">
                    <span className="historial-version">
                      {indice === 0 ? 'Versión actual' : `Versión ${historial.historial.length - indice}`}
                    </span>
                    {version.es_actualizacion && <span className="historial-tag">Actualización</span>}
                    {version.tuvo_conflicto && (
                      <span className="historial-tag historial-tag--merge">
                        <GitMerge size={12} /> Smart Merge
                      </span>
                    )}
                  </div>

                  <dl className="historial-meta">
                    <div>
                      <dt>Capturada</dt>
                      <dd>{formatearFecha(version.fecha_encuesta)}</dd>
                    </div>
                    <div>
                      <dt>Sincronizada</dt>
                      <dd>{formatearFecha(version.fecha_sincronizacion)}</dd>
                    </div>
                    <div>
                      <dt>Encuestador</dt>
                      <dd>{version.encuestador || 'No registrado'}</dd>
                    </div>
                  </dl>

                  <pre className="historial-json">
                    {JSON.stringify(version.datos_recolectados, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
