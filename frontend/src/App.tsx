import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import OperacionPage from './pages/OperacionPage'
import UsuariosPage from './pages/UsuariosPage'
import LoginPage from './pages/LoginPage'
import { leerToken } from './services/sesion'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (!leerToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    // Los avisos viven sobre todo el arbol: cualquier pantalla puede lanzarlos
    // sin montar su propio contenedor.
    <ToastProvider>
      <Routes>
        {/* Landing pública */}
        <Route path="/" element={<LandingPage />} />

        {/* Login de administración */}
        <Route path="/login" element={<LoginPage />} />

        {/* Panel administrativo protegido */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/operacion" element={<OperacionPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />

          {/* Las rutas viejas siguen resolviendo: un enlace guardado a
              /personas o /conflictos no debe acabar en la landing. */}
          <Route path="/personas" element={<Navigate to="/operacion" replace />} />
          <Route path="/conflictos" element={<Navigate to="/operacion?ver=conflicto" replace />} />
          <Route path="/reportes" element={<Navigate to="/operacion" replace />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
