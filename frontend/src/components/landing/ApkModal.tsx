import React from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import './ApkModal.css';

interface ApkModalProps {
  onClose: () => void;
}

const ApkModal: React.FC<ApkModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <Smartphone size={22} color="#2563eb" />
            <h3>Descargar App Móvil</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p>Instala la aplicación nativa Android para captura de encuestas sin conexión.</p>
          
          <div className="apk-info-box">
            <div className="info-row">
              <span className="info-label">Archivo:</span>
              <span className="info-value">EncuestasOffline-v1.0.apk</span>
            </div>
            <div className="info-row">
              <span className="info-label">Compatibilidad:</span>
              <span className="info-value">Android 8.0+ (API 26)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Seguridad:</span>
              <span className="info-value">Cifrado SQLCipher</span>
            </div>
          </div>

          <a 
            href="/EncuestasOffline-v1.0.apk" 
            download="EncuestasOffline-v1.0.apk" 
            className="btn-modal-download"
            onClick={() => {
              alert("Descargando paquete de instalación APK...");
              onClose();
            }}
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
