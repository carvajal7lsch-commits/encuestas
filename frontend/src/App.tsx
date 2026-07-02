import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import ConflictosPage from './pages/ConflictosPage'
import ReportesPage from './pages/ReportesPage'
import PersonasPage from './pages/PersonasPage'
import UsuariosPage from './pages/UsuariosPage'
import LoginPage from './pages/LoginPage'
import './App.css'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Landing Page Pública */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Login Administrador */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Dashboard Administrativo Protegido */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/conflictos" element={<ConflictosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
