import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.login(documento, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.usuario));
      navigate('/personas');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas o usuario inactivo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-login-container">
      {/* Columna Izquierda: Banner Visual Ilustrativo Geométrico */}
      <div className="login-visual-side">
        <div className="visual-pattern-grid">
          <div className="pattern-tile tile-1">
            <div className="tile-icon-box">
              <ClipboardList size={42} color="#ffffff" />
            </div>
          </div>
          <div className="pattern-tile tile-2">
            <div className="tile-content">
              <span className="tile-badge">100% Offline</span>
              <p>Captura de datos en zonas rurales sin internet</p>
            </div>
          </div>
          <div className="pattern-tile tile-3">
            <div className="tile-icon-box">
              <ShieldCheck size={42} color="#2563eb" />
            </div>
          </div>
          <div className="pattern-tile tile-4">
            <div className="tile-content">
              <span className="tile-badge-alt">Smart Merge</span>
              <p>Fusión atómica sin pérdida de información</p>
            </div>
          </div>
        </div>

        <div className="visual-side-footer">
          <h3>Sistema de Encuestas Offline</h3>
          <p>Plataforma de Auditoría y Administración de Salud en Campo</p>
        </div>
      </div>

      {/* Columna Derecha: Formulario Limpio Blanco (Estilo Zooki / Reference) */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          {/* Top Brand Logo */}
          <div className="brand-header-row" onClick={() => navigate('/')}>
            <div className="brand-logo-icon">
              <ClipboardList size={22} color="#ffffff" />
            </div>
            <span className="brand-logo-text">Encuestas<span>Offline</span></span>
          </div>

          {/* Login Title & Subtitle */}
          <div className="form-head-title">
            <h1>Iniciar sesión</h1>
            <p>¡Bienvenido de vuelta! Accede a tu cuenta para continuar.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="split-form">
            {error && (
              <div className="form-error-alert">
                <span>{error}</span>
              </div>
            )}

            <div className="input-group-custom">
              <label>E-mail / Documento</label>
              <input 
                type="text" 
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Entre con su e-mail / documento"
                required 
              />
            </div>

            <div className="input-group-custom">
              <label>Contraseña</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
                <button 
                  type="button" 
                  className="toggle-password-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options-row">
              <label className="remember-me-checkbox">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span>Recuérdame</span>
              </label>
              <a 
                href="#forgot" 
                className="forgot-password-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para restablecer su contraseña de administrador, contacte a la mesa de soporte técnico.');
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn-split-submit" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="login-footer-back">
            <button className="btn-back-landing" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              <span>Volver a la página de Inicio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
