import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Eye } from 'lucide-react';
import { api } from '../services/api';
import './PersonasPage.css';

export default function PersonasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const data = await api.getPersonas();
      setPersonas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonas = (Array.isArray(personas) ? personas : []).filter(p => 
    String(p?.numero_documento || '').includes(searchTerm) || 
    String(p?.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p?.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Directorio de Personas</h1>
          <p className="page-subtitle">CRUD estándar para consulta y auditoría de ciudadanos encuestados</p>
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
              <th>Documento</th>
              <th>Nombres y Apellidos</th>
              <th>Municipio</th>
              <th>Última Sincronización</th>
              <th className="action-cell">Auditoría</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '20px', color: 'red'}}>{error}</td></tr>
            ) : filteredPersonas.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>No hay datos registrados</td></tr>
            ) : filteredPersonas.map((persona, idx) => (
              <tr key={persona.numero_documento || idx}>
                <td className="font-mono">{persona.numero_documento}</td>
                <td className="font-medium">{persona.nombres} {persona.apellidos}</td>
                <td>{persona.municipio || 'N/A'}</td>
                <td>
                  <div className="date-cell">
                    <Clock size={14} className="text-muted" />
                    {new Date(persona.updated_at).toLocaleString()}
                  </div>
                </td>
                <td className="action-cell">
                  <button className="btn-icon-small" title="Ver Historial Inmutable" onClick={() => alert('Próximamente: Historial de ' + persona.nombres)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
