import type { ComponentType } from 'react';
import {
  Database,
  GitMerge,
  Layers,
  RefreshCw,
  Rows3,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import Logo from './Logo';
import estilos from './Mosaico.module.css';

/**
 * Mosaico geométrico del login.
 *
 * No es decoración aleatoria: los pictogramas son el vocabulario del sistema
 * —sin señal, sincronización, fusión, versiones, registros, dispositivo,
 * auditoría— repartidos entre geometría muda que deja respirar.
 *
 * Los pictogramas vienen de lucide, la misma librería que usa el resto del
 * panel. Una primera versión los dibujaba a mano con paths propios y se notaba:
 * el grosor de trazo y las proporciones no casaban con nada. La geometría pura
 * (círculos, cuartos, rombos) sí es propia, porque ahí no hay nada que imitar.
 *
 * La marca sí sigue siendo nuestra: aparece una vez, descentrada, como en un
 * pliego de imprenta.
 *
 * El patrón está escrito a mano y es fijo. Generarlo al azar lo cambiaría en
 * cada render y dejaría de ser una marca.
 */

type Motivo =
  // Geometría propia
  | '.' | 'o' | 'q' | 'd' | 'r' | 't' | '/' | 'c'
  // Pictogramas de la librería
  | 'sin-senal' | 'sincronizar' | 'fusion' | 'versiones'
  | 'registros' | 'dispositivo' | 'auditoria' | 'base'
  // La marca
  | 'marca';

const ICONOS: Partial<Record<Motivo, ComponentType<{ className?: string }>>> = {
  'sin-senal': WifiOff,
  sincronizar: RefreshCw,
  fusion: GitMerge,
  versiones: Layers,
  registros: Rows3,
  dispositivo: Smartphone,
  auditoria: ShieldCheck,
  base: Database,
};

const MOTIVOS: Motivo[][] = [
  ['o', 'q', '.', 'd', '.', 'r', '.', 'q'],
  ['registros', 'r', '.', '.', 'q', '.', '.', '/'],
  ['.', '.', 'sincronizar', '.', '.', 'sin-senal', '.', 't'],
  ['t', '.', '.', 'base', '.', 'r', '.', 'fusion'],
  ['/', '.', 'q', 'marca', '.', '.', 'c', '.'],
  ['c', 'd', '.', '.', '.', 't', '.', 'versiones'],
  ['.', 'o', '/', '.', 'dispositivo', '.', 'r', '.'],
  ['auditoria', '.', 'r', '.', 'd', '.', 'registros', '.'],
];

/** Nivel de fondo de cada celda: 0 el más oscuro, 4 el más claro. */
const FONDOS: number[][] = [
  [3, 1, 0, 2, 0, 1, 0, 2],
  [2, 4, 0, 0, 1, 0, 0, 3],
  [0, 0, 1, 0, 0, 2, 0, 0],
  [1, 0, 0, 2, 0, 1, 0, 1],
  [0, 0, 1, 3, 0, 0, 2, 0],
  [2, 1, 0, 0, 0, 1, 0, 2],
  [0, 2, 1, 0, 1, 0, 0, 0],
  [1, 0, 0, 2, 1, 0, 3, 0],
];

/**
 * Tinta de cada pieza, elegida a mano y no por fórmula.
 * 0 azul de marca · 1 azul claro · 2 casi blanco · 3 cian.
 *
 * El casi blanco da el golpe de vista y por eso está racionado; el cian aparece
 * dos veces en toda la composición. Una primera versión repartía los cuatro
 * tonos por fórmula y el cian, el más luminoso, caía cada pocas celdas y se
 * comía al azul de la marca.
 */
const TINTAS: number[][] = [
  [0, 2, 0, 0, 0, 2, 0, 1],
  [0, 0, 0, 0, 1, 0, 0, 3],
  [0, 0, 1, 0, 0, 1, 0, 2],
  [2, 0, 0, 1, 0, 3, 0, 0],
  [0, 0, 2, 1, 0, 0, 1, 0],
  [2, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 1, 0, 0, 0],
  [2, 0, 0, 0, 2, 0, 0, 0],
];

const FONDO = ['#070c17', '#0b1424', '#101d36', '#17294c', '#1e3a6b'];
const TINTA = ['#4d8dff', '#8ab4ff', '#e8f0ff', '#2bd7ee'];

/** Geometría propia, en un lienzo local de 0 a 100. */
function Geometria({ motivo, tinta }: { motivo: Motivo; tinta: string }) {
  const formas: Partial<Record<Motivo, string>> = {
    o: 'M50 20 A30 30 0 1 1 49.9 20 Z',
    q: 'M0 100 A100 100 0 0 1 100 0 L100 100 Z',
    d: 'M0 50 A50 50 0 0 1 100 50 Z',
    r: 'M50 18 L82 50 L50 82 L18 50 Z',
    t: 'M12 84 L50 16 L88 84 Z',
    '/': 'M8 92 L66 8 L92 8 L34 92 Z',
  };

  if (motivo === 'c') {
    return (
      <svg viewBox="0 0 100 100" className={estilos.forma} aria-hidden="true">
        <rect x="24" y="24" width="52" height="52" fill="none" stroke={tinta} strokeWidth="6" />
      </svg>
    );
  }

  const d = formas[motivo];
  if (!d) return null;

  return (
    <svg viewBox="0 0 100 100" className={estilos.forma} aria-hidden="true">
      <path d={d} fill={tinta} />
    </svg>
  );
}

interface MosaicoProps {
  className?: string;
}

export default function Mosaico({ className = '' }: MosaicoProps) {
  return (
    // Decorativo: el nombre del producto ya lo dice el logotipo del formulario,
    // así que anunciarlo otra vez sería ruido para un lector.
    <div className={`${estilos.mosaico} ${className}`} aria-hidden="true">
      {MOTIVOS.map((fila, y) =>
        fila.map((motivo, x) => {
          const tinta = TINTA[TINTAS[y][x]];
          const Icono = ICONOS[motivo];

          return (
            <div
              key={`${x}-${y}`}
              className={estilos.celda}
              style={{ background: FONDO[FONDOS[y][x]], color: tinta }}
            >
              {motivo === 'marca' ? (
                <span
                  className={estilos.marca}
                  style={{ ['--logo-primario' as string]: tinta, ['--logo-secundario' as string]: tinta }}
                >
                  <Logo tamano={44} soloMarca />
                </span>
              ) : Icono ? (
                <Icono className={estilos.icono} />
              ) : (
                <Geometria motivo={motivo} tinta={tinta} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
