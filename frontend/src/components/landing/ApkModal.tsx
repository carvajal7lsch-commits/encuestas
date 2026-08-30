import React, { useEffect, useRef } from 'react';
import { Smartphone, X, Download, ShieldCheck, HardDrive, Cpu } from 'lucide-react';
import './ApkModal.css';

interface ApkModalProps {
  onClose: () => void;
}

const APK_FILE = 'EncuestasOffline-v1.0.apk';

const SPECS = [
  { icon: HardDrive, label: 'Archivo', value: APK_FILE },
  { icon: Cpu, label: 'Compatibilidad', value: 'Android 8.0+ (API 26)' },
  { icon: ShieldCheck, label: 'Seguridad', value: 'Base local cifrada (SQLCipher)' },
];

const STEPS = [
  'Descarga el archivo .apk en el dispositivo.',
  'Autoriza la instalación desde orígenes desconocidos si Android lo solicita.',
  'Abre el archivo descargado e instala la aplicación.',
];

const ApkModal: React.FC<ApkModalProps> = ({ onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apk-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-title-icon">
              <Smartphone size={20} />
            </span>
            <div>
              <h3 id="apk-modal-title">Descargar la app móvil</h3>
              <span className="modal-subtitle">Versión 1.0 · 32 MB</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} ref={closeRef} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>
            Aplicación nativa para captura de encuestas sin conexión. Se distribuye por fuera de
            Google Play, así que la instalación es directa desde el archivo.
          </p>

          <div className="apk-info-box">
            {SPECS.map((spec) => {
              const Icon = spec.icon;
              return (
                <div className="info-row" key={spec.label}>
                  <span className="info-label">
                    <Icon size={14} /> {spec.label}
                  </span>
                  <span className="info-value">{spec.value}</span>
                </div>
              );
            })}
          </div>

          <ol className="apk-steps">
            {STEPS.map((step, i) => (
              <li key={step}>
                <span className="apk-step-num">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <a
            href={'/' + APK_FILE}
            download={APK_FILE}
            className="l-btn l-btn--primary btn-modal-download"
            onClick={onClose}
          >
            <Download size={18} />
            <span>Descargar APK (v1.0)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApkModal;
