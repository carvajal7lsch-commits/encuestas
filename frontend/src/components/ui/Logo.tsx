import estilos from './Logo.module.css';

interface LogoProps {
  /** Alto del isotipo en px. El texto escala con él. */
  tamano?: number;
  /** Solo el símbolo, sin el nombre. */
  soloMarca?: boolean;
  /** Encierra el símbolo en la placa redondeada (barra lateral, favicon). */
  placa?: boolean;
  className?: string;
}

/**
 * Marca única del producto.
 *
 * El símbolo es un cuaderno de campo: argollas, hoja y tres apuntes. Es una
 * referencia directa a la libreta que usa un encuestador, incluso sin señal.
 * El mismo dibujo se replica en el favicon y en el launcher de Android.
 *
 * El mismo dibujo existe como vector de Android en
 * Encuestasoffline/app/src/main/res/drawable/ic_logo.xml y como favicon en
 * frontend/public/favicon.svg: los tres deben cambiar juntos.
 */
export default function Logo({
  tamano = 28,
  soloMarca = false,
  placa = false,
  className = '',
}: LogoProps) {
  const simbolo = (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="EncuestasOffline"
      className={estilos.simbolo}
    >
      <path
        d="M8 5.5A2.5 2.5 0 0 1 10.5 3h11A2.5 2.5 0 0 1 24 5.5v21A2.5 2.5 0 0 1 21.5 29h-11A2.5 2.5 0 0 1 8 26.5z"
        className={estilos.cuaderno}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M12 3v26" className={estilos.lomo} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M15.5 10h5M15.5 14h5M15.5 18h3.5M9.5 8h2M9.5 15h2M9.5 22h2"
        className={estilos.notas}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m15.5 23 1.5 1.5 3-3"
        className={estilos.check}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const marca = placa ? <span className={estilos.placa}>{simbolo}</span> : simbolo;

  if (soloMarca) {
    return <span className={`${estilos.contenedor} ${className}`}>{marca}</span>;
  }

  return (
    <span className={`${estilos.contenedor} ${className}`}>
      {marca}
      <span className={estilos.nombre} style={{ fontSize: tamano * 0.62 }}>
        Encuestas<span className={estilos.nombreAcento}>Offline</span>
      </span>
    </span>
  );
}
