import { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import './UsuariosPage.css';

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({ numero_documento: '', nombre_completo: '', password: '', rol: 'encuestador' });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createUsuario(formData);
      setShowModal(false);
      setFormData({ numero_documento: '', nombre_completo: '', password: '', rol: 'encuestador' });
      loadUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (id: number) => {
    if (!window.confirm('¿Seguro que desea cambiar el estado de este usuario?')) return;
    try {
      await api.toggleUsuario(id);
      loadUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsuarios = (Array.isArray(usuarios) ? usuarios : []).filter(u => 
    String(u?.numero_documento || '').includes(searchTerm) || 
    String(u?.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra los encuestadores y supervisores del sistema</p>
        </div>
        <div className="header-actions">
          <div className="search-bar glass-panel">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar usuario..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre Completo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="action-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>Cargando...</td></tr>
            ) : filteredUsuarios.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>No hay usuarios</td></tr>
            ) : filteredUsuarios.map((user) => (
              <tr key={user.id_usuario}>
                <td className="font-mono">{user.numero_documento}</td>
                <td className="font-medium">{user.nombre_completo}</td>
                <td>
                  <span className={`role-badge role-${user.rol}`}>
                    {user.rol}
                  </span>
                </td>
                <td>
                  {user.activo ? (
                    <span className="status-badge status-active">
                      <CheckCircle2 size={14} /> Activo
                    </span>
                  ) : (
                    <span className="status-badge status-inactive">
                      <XCircle size={14} /> Inactivo
                    </span>
                  )}
                </td>
                <td className="action-cell">
                  <button className="btn-icon-small" title={user.activo ? "Desactivar" : "Activar"} onClick={() => handleToggle(user.id_usuario)}>
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button className="btn-icon-small" onClick={() => setShowModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Número de Documento</label>
                <input type="text" placeholder="Ej. 10203040" value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" placeholder="Nombre Apellido" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Contraseña Temporal</label>
                <input type="password" placeholder="******" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                  <option value="encuestador">Encuestador</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreate}>Guardar Usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
