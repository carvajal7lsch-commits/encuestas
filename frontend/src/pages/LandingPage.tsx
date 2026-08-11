import React, { useState, useEffect } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingFeatures from '../components/landing/LandingFeatures';
import SmartMergeInfo from '../components/landing/SmartMergeInfo';
import LandingFooter from '../components/landing/LandingFooter';
import ApkModal from '../components/landing/ApkModal';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [showApkModal, setShowApkModal] = useState(false);

  // Garantizar que al cargar o recargar la página SIEMPRE se posicione arriba en el tope (0, 0)
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="landing-container">
      {/* Hero Wrapper with Dark Gradient */}
      <div className="hero-dark-wrapper">
        {/* Ambient Background Glows */}
        <div className="glow-blob glow-blob-1"></div>

        {/* Top Navigation Bar */}
        <LandingHeader />

        {/* Hero Section */}
        <LandingHero onDownloadApk={() => setShowApkModal(true)} />
      </div>

      {/* Light Background Content Sections */}
      <div className="light-content-wrapper">
        {/* Section 1: Features Grid */}
        <LandingFeatures />

        {/* Section 2: Smart Merge Diagram */}
        <SmartMergeInfo />

        {/* Footer */}
        <LandingFooter />
      </div>

      {/* Modal Download APK */}
      {showApkModal && (
        <ApkModal onClose={() => setShowApkModal(false)} />
      )}
    </div>
  );
};

export default LandingPage;
