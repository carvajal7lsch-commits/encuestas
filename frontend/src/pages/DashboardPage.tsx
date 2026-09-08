import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  ShieldAlert,
  UserCheck,
  RefreshCcw,
  ArrowRight,
  CloudUpload
} from 'lucide-react';
import { api } from '../services/api';
import './DashboardPage.css';

interface Stats {
  totalEncuestas: number;
  totalPersonas: number;
  totalConflictos: number;
  encuestadoresActivos: number;
  ultimaSincronizacion: string | null;
}

const formatearFecha = (valor: string | null) => {
  if (!valor) return 'Sin sincronizaciones aún';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : fecha.toLocaleString();
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      setStats(await api.getStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const tarjetas = [
    {
      etiqueta: 'Encuestas sincronizadas',
      valor: stats?.totalEncuestas,
      detalle: 'Versiones recibidas desde los celulares',
      icono: ClipboardList,
      tono: 'azul',
      destino: '/personas'
    },
    {
      etiqueta: 'Personas registradas',
      valor: stats?.totalPersonas,
      detalle: 'Ciudadanos únicos en la base consolidada',
      icono: Users,
      tono: 'verde',
      destino: '/personas'
    },
    {
      etiqueta: 'Conflictos resueltos',
      valor: stats?.totalConflictos,
      detalle: 'Fusiones aplicadas por el Smart Merge',
      icono: ShieldAlert,
      tono: 'ambar',
      destino: '/conflictos'
    },
    {
      etiqueta: 'Encuestadores activos',
      valor: stats?.encuestadoresActivos,
      detalle: 'Cuentas habilitadas para capturar en campo',
      icono: UserCheck,
      tono: 'violeta',
      destino: '/usuarios'
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Resumen del sistema</h1>
          <p className="page-subtitle">Estado consolidado de la operación en campo</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon glass-panel" onClick={cargar} title="Actualizar datos" disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error glass-panel">{error}</div>}

      <div className="stats-grid">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;
          return (
            <button
              key={tarjeta.etiqueta}
              className={`stat-card glass-panel tono-${tarjeta.tono}`}
              onClick={() => navigate(tarjeta.destino)}
            >
              <span className="stat-icon">
                <Icono size={20} />
              </span>
              <span className="stat-value">
                {loading ? '—' : (tarjeta.valor ?? 0).toLocaleString()}
              </span>
              <span className="stat-label">{tarjeta.etiqueta}</span>
              <span className="stat-detail">{tarjeta.detalle}</span>
              <span className="stat-link">
                Ver detalle <ArrowRight size={13} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="dashboard-sync glass-panel">
        <span className="sync-icon">
          <CloudUpload size={20} />
        </span>
        <div>
          <h3>Última sincronización recibida</h3>
          <p>{loading ? 'Consultando…' : formatearFecha(stats?.ultimaSincronizacion ?? null)}</p>
        </div>
      </div>
    </div>
  );
}
