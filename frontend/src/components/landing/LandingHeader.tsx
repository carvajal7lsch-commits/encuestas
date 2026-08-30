import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Lock, Menu, X } from 'lucide-react';
import './LandingHeader.css';

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#caracteristicas', label: 'Características' },
  { href: '#smartmerge', label: 'Smart Merge' },
  { href: '#faq', label: 'FAQ' },
];

const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (y / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar el menú móvil al volver a viewport de escritorio
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const goToLogin = useCallback(() => {
    setMenuOpen(false);
    navigate('/login');
  }, [navigate]);

  const headerClass = scrolled ? 'landing-header is-scrolled' : 'landing-header';

  return (
    <header className={headerClass}>
      <div className="landing-progress" style={{ transform: 'scaleX(' + progress / 100 + ')' }} />

      <div className="landing-nav-content l-container">
        <div
          className="landing-brand"
          onClick={() => navigate('/')}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <span className="brand-icon">
            <ClipboardList size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-text-box">
            <span className="brand-title">
              <span>Encuestas</span>
              <span className="brand-title-alt">Offline</span>
            </span>
            <span className="brand-badge">Salud en campo · Offline-first</span>
          </span>
        </div>

        <nav className="landing-nav-links" aria-label="Secciones">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-header-actions">
          <button className="btn-admin-login" onClick={goToLogin}>
            <Lock size={15} />
            <span>
              <span className="l-only-desktop">Acceso </span>Admin
            </span>
          </button>

          <button
            className="btn-nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={menuOpen ? 'landing-mobile-menu is-open' : 'landing-mobile-menu'}>
        <nav aria-label="Secciones (móvil)">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="#arquitectura" onClick={() => setMenuOpen(false)}>
            Arquitectura
          </a>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
