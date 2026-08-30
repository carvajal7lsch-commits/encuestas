import React, { useState } from 'react';
import { CircleHelp, Plus } from 'lucide-react';
import './LandingFaq.css';

const FAQS = [
  {
    q: '¿Necesito internet para usar la aplicación?',
    a: 'Solo para descargar el APK la primera vez y para sincronizar. La captura, edición y validación de encuestas funciona completa con el modo avión activado: nada de la interfaz depende de una respuesta del servidor.',
  },
  {
    q: '¿Qué pasa si dos encuestadores registran a la misma persona?',
    a: 'El Smart Merge Engine compara campo por campo y conserva el aporte de ambos en lugar de dejar ganar al último que sincronizó. La decisión queda registrada en log_conflictos para que el administrador la revise desde el panel web.',
  },
  {
    q: '¿Los datos del ciudadano están protegidos en el dispositivo?',
    a: 'La base local se almacena cifrada con SQLCipher, de modo que un tercero con acceso físico al teléfono no puede leer los registros. La comunicación con la API viaja sobre HTTPS y requiere un token JWT válido.',
  },
  {
    q: '¿Cómo compruebo que ningún dato se perdió?',
    a: 'PostgreSQL mantiene un histórico append-only gestionado por triggers: cada modificación guarda autor, fecha, valor anterior y valor nuevo. Nada se borra, así que siempre es posible reconstruir la trazabilidad completa de un registro.',
  },
  {
    q: '¿Qué versiones de Android son compatibles?',
    a: 'Android 8.0 (API 26) en adelante. El APK se instala de forma directa habilitando la instalación desde orígenes desconocidos, ya que se distribuye fuera de Google Play.',
  },
  {
    q: '¿Quién puede entrar al panel de administración?',
    a: 'Únicamente usuarios con rol administrador. El acceso se autentica contra la API con JWT y las rutas del dashboard quedan protegidas en el cliente y validadas nuevamente en el servidor.',
  },
];

const LandingFaq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="l-section faq-section">
      <div className="l-container">
        <div className="l-section-head l-section-head--center l-reveal">
          <span className="l-eyebrow">
            <CircleHelp size={13} /> Preguntas frecuentes
          </span>
          <h2>Lo que suelen preguntar antes de salir a campo</h2>
        </div>

        <div className="faq-list l-reveal">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={isOpen ? 'faq-item is-open' : 'faq-item'}>
                <button
                  className="faq-question"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={'faq-panel-' + i}
                  id={'faq-trigger-' + i}
                >
                  <span>{item.q}</span>
                  <Plus size={18} className="faq-toggle-icon" />
                </button>
                <div
                  className="faq-answer"
                  id={'faq-panel-' + i}
                  role="region"
                  aria-labelledby={'faq-trigger-' + i}
                >
                  <div className="faq-answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFaq;
