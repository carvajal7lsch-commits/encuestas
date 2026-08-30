import React, { useEffect, useState } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingSteps from '../components/landing/LandingSteps';
import LandingFeatures from '../components/landing/LandingFeatures';
import SmartMergeInfo from '../components/landing/SmartMergeInfo';
import LandingArchitecture from '../components/landing/LandingArchitecture';
import LandingFaq from '../components/landing/LandingFaq';
import LandingFooter from '../components/landing/LandingFooter';
import ApkModal from '../components/landing/ApkModal';
import useScrollReveal from '../hooks/useScrollReveal';
import '../components/landing/landing-theme.css';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [showApkModal, setShowApkModal] = useState(false);

  useScrollReveal();

  // Al cargar o recargar, la página siempre debe quedar en el tope
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // La landing es la única vista oscura del sitio: el fondo del documento y
  // la barra de scroll nativa deben oscurecerse solo mientras está montada,
  // para no afectar el tema claro del dashboard.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('is-dark-landing');
    root.style.colorScheme = 'dark';
    return () => {
      root.classList.remove('is-dark-landing');
      root.style.colorScheme = '';
    };
  }, []);

  const openApkModal = () => setShowApkModal(true);

  return (
    <div className="landing-container">
      {/* Capas de fondo: retícula y halos de color */}
      <div className="landing-backdrop" aria-hidden="true">
        <div className="backdrop-grid" />
        <div className="backdrop-glow backdrop-glow--blue" />
        <div className="backdrop-glow backdrop-glow--cyan" />
        <div className="backdrop-glow backdrop-glow--emerald" />
      </div>

      <LandingHeader />

      <main className="landing-main">
        <LandingHero onDownloadApk={openApkModal} />
        <LandingSteps />
        <LandingFeatures />
        <SmartMergeInfo />
        <LandingArchitecture />
        <LandingFaq />
      </main>

      <LandingFooter onDownloadApk={openApkModal} />

      {showApkModal && <ApkModal onClose={() => setShowApkModal(false)} />}
    </div>
  );
};

export default LandingPage;
