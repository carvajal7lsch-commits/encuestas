import { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, XCircle } from 'lucide-react';
import { api } from '../services/api';
import './ConflictosPage.css';

export default function ConflictosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [conflictos, setConflictos] = useState<any[]>([]);
  const [selectedConflicto, setSelectedConflicto] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflictos();
  }, []);

  const loadConflictos = async () => {
    try {
      setLoading(true);
      const data = await api.getConflictos();
      setConflictos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConflictos = (Array.isArray(conflictos) ? conflictos : []).filter(c => 
    String(c?.id_encuesta_nueva || '').includes(searchTerm) || 
    Object.keys(c?.campos_en_conflicto || {}).join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Resolución de Conflictos</h1>
          <p className="page-subtitle">Auditoría del Smart Merge: historial de conflictos sincronizados</p>
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
          <button className="btn-icon glass-panel">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Encuesta</th>
              <th>Campos en Conflicto</th>
              <th>Estrategia</th>
              <th>Resuelto Por</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>Cargando...</td></tr>
            ) : filteredConflictos.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>No hay conflictos registrados</td></tr>
            ) : filteredConflictos.map((conflicto) => (
              <tr key={conflicto.id_log} onClick={() => setSelectedConflicto(conflicto)} className="clickable-row">
                <td className="font-mono">ID-{conflicto.id_encuesta_nueva}</td>
                <td>
                  <div className="conflict-fields">
                    {Object.keys(conflicto.campos_en_conflicto || {}).map((campo: string) => (
                      <span key={campo} className="field-badge">{campo}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`strategy-badge strategy-${conflicto.estrategia}`}>
                    {conflicto.estrategia}
                  </span>
                </td>
                <td className="font-medium text-sm">{conflicto.resuelto_por || 'Sistema'}</td>
                <td className="text-muted text-sm">{new Date(conflicto.creado_en).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedConflicto && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <div>
                <h2>Detalle del Conflicto</h2>
                <p className="text-muted mt-1">Estrategia aplicada: <strong style={{color: 'var(--text-primary)'}}>{selectedConflicto.estrategia}</strong> por {selectedConflicto.resuelto_por || 'Sistema'}</p>
              </div>
              <button className="btn-icon-small" onClick={() => setSelectedConflicto(null)}>
                <XCircle size={24} />
              </button>
            </div>
            <div className="json-comparison">
              <div className="json-column">
                <h4>Datos Anteriores (Servidor)</h4>
                <pre className="json-block code-antes">
                  {JSON.stringify(selectedConflicto.datos_anteriores, null, 2)}
                </pre>
              </div>
              <div className="merge-arrow">
                <XCircle className="clash-icon" size={24} />
              </div>
              <div className="json-column">
                <h4>Datos Entrantes (Celular)</h4>
                <pre className="json-block code-entrante">
                  {JSON.stringify(selectedConflicto.datos_entrantes, null, 2)}
                </pre>
              </div>
              <div className="merge-arrow">
                <ArrowRight size={24} />
              </div>
              <div className="json-column result-column">
                <h4>Resultado (Smart Merge)</h4>
                <pre className="json-block code-resultado">
                  {JSON.stringify(selectedConflicto.datos_resultado, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
