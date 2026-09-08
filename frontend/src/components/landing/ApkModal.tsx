import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, X, Download, ShieldCheck, HardDrive, Cpu, RefreshCw } from 'lucide-react';
import './ApkModal.css';

interface ApkModalProps {
  onClose: () => void;
}

/** Nombre estable: no lleva la versión, así el enlace nunca queda obsoleto. */
const APK_FILE = 'EncuestasOffline.apk';

/** Manifiesto que publica scripts/publicar-apk.ps1 junto al APK. */
const VERSION_URL = '/app-version.json';

interface VersionPublicada {
  versionName: string;
  tamanoMb?: number;
  notas?: string[];
}

const STEPS = [
  'Descarga el archivo .apk en el dispositivo.',
  'Autoriza la instalación desde orígenes desconocidos si Android lo solicita.',
  'Abre el archivo descargado e instala la aplicación.',
  'A partir de aquí la app te avisa sola cuando haya una versión nueva.',
];

const ApkModal: React.FC<ApkModalProps> = ({ onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [version, setVersion] = useState<VersionPublicada | null>(null);

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

  // La versión se lee del manifiesto en vez de estar escrita a mano, para que no
  // se desactualice cada vez que se publica una compilación nueva.
  useEffect(() => {
    let vigente = true;
    fetch(VERSION_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((datos) => {
        if (vigente && datos) setVersion(datos);
      })
      .catch(() => {
        /* Sin manifiesto se muestran los datos genéricos. */
      });
    return () => {
      vigente = false;
    };
  }, []);

  const etiquetaVersion = version ? `Versión ${version.versionName}` : 'Última versión';
  const etiquetaTamano = version?.tamanoMb ? ` · ${version.tamanoMb} MB` : '';

  const specs = [
    { icon: HardDrive, label: 'Archivo', value: APK_FILE },
    { icon: Cpu, label: 'Compatibilidad', value: 'Android 8.0+ (API 26)' },
    { icon: RefreshCw, label: 'Actualizaciones', value: 'Automáticas desde la app' },
    { icon: ShieldCheck, label: 'Seguridad', value: 'Base local cifrada (SQLCipher)' },
  ];

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
              <span className="modal-subtitle">{etiquetaVersion}{etiquetaTamano}</span>
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
            {specs.map((spec) => {
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
            <span>Descargar APK{version ? ` (v${version.versionName})` : ''}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApkModal;
