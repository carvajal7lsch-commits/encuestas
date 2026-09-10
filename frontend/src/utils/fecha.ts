/**
 * Formateo de fechas del panel.
 *
 * Estaba duplicado en dos pantallas y habia una tercera variante inline sin
 * ninguna proteccion: con una fecha nula reventaba el render y, al no haber
 * ErrorBoundary, dejaba la pantalla en blanco.
 */
export function formatearFecha(valor: string | null | undefined, respaldo = 'Sin fecha'): string {
  if (!valor) return respaldo;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? respaldo : fecha.toLocaleString();
}

/** Compacta y sin segundos: "2 jul 2026, 14:54". Para cabeceras. */
export function formatearFechaCorta(valor: string | null | undefined, respaldo = 'Sin fecha'): string {
  if (!valor) return respaldo;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? respaldo
    : fecha.toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        // 24h: "02:54 p. m." ocupa mas y se lee peor en una cabecera.
        hour12: false,
      });
}

/** Igual que formatearFecha pero sin la hora. */
export function formatearDia(valor: string | null | undefined, respaldo = 'Sin fecha'): string {
  if (!valor) return respaldo;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? respaldo : fecha.toLocaleDateString();
}

/**
 * "hace 3 horas", "hace 2 dias". El resumen antes dedicaba una tarjeta entera a
 * la fecha absoluta de la ultima sincronizacion; lo que se quiere saber de un
 * vistazo es cuanto hace, no el timestamp exacto.
 */
export function formatearRelativo(valor: string | null | undefined, respaldo = 'Sin datos'): string {
  if (!valor) return respaldo;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return respaldo;

  const segundos = Math.round((fecha.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const escalas: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2592000, 'day'],
    [31536000, 'month'],
    [Infinity, 'year'],
  ];
  const divisores = [1, 60, 3600, 86400, 2592000, 31536000];

  for (let i = 0; i < escalas.length; i += 1) {
    if (Math.abs(segundos) < escalas[i][0]) {
      return rtf.format(Math.round(segundos / divisores[i]), escalas[i][1]);
    }
  }
  return respaldo;
}
