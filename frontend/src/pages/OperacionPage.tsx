import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  RefreshCcw,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useRecurso } from '../hooks/useRecurso';
import { formatearFecha, formatearRelativo } from '../utils/fecha';
import {
  Badge,
  DataTable,
  IconButton,
  PageHeader,
  ResolucionConflicto,
  SearchInput,
  useToast,
  type CampoEnConflicto,
  type Columna,
} from '../components/ui';
import estilos from './OperacionPage.module.css';

interface Persona {
  numero_documento: string;
  tipo_documento: string | null;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  eps: string | null;
  estrato: number | null;
  municipio: string | null;
  departamento: string | null;
  sync_version: string | number;
  updated_at: string;
  versiones: string | number;
  conflictos: string | number;
  ultima_encuesta: string | null;
  ultimo_encuestador: string | null;
}

interface Version {
  id_encuesta: string;
  datos_recolectados: Record<string, unknown> | null;
  fecha_encuesta: string;
  fecha_sincronizacion: string | null;
  es_actualizacion: boolean;
  dispositivo_id: string | null;
  encuestador: string | null;
  tuvo_conflicto: boolean;
  campos_en_conflicto: Record<string, CampoEnConflicto> | null;
  estrategia: string | null;
  resuelto_por: string | null;
}

interface Ficha {
  persona: Persona & { direccion?: string | null; ocupacion?: string | null; email?: string | null };
  historial: Version[];
}

const FILTROS = [
  { clave: 'todas', texto: 'Todas' },
  { clave: 'conflicto', texto: 'Con conflicto' },
  { clave: 'actualizadas', texto: 'Actualizadas' },
] as const;

type ClaveFiltro = (typeof FILTROS)[number]['clave'];

/**
 * Fecha local en formato YYYY-MM-DD.
 *
 * toISOString() no sirve aqui: convierte a UTC, y en Colombia (UTC-5) a partir
 * de las 19:00 devolveria ya el dia siguiente. "Hoy" dejaria de ser hoy justo
 * al final de la jornada de campo, que es cuando mas se consulta.
 */
const aISO = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

/** Hoy menos n dias. */
const haceDias = (n: number) => {
  const f = new Date();
  f.setDate(f.getDate() - n);
  return f;
};

/**
 * Rangos de un clic. Elegir dos fechas en un calendario para preguntar "que se
 * capturo hoy" es demasiado trabajo para la pregunta mas frecuente.
 */
const RANGOS = [
  { clave: 'todo', texto: 'Todo', calcular: () => ['', ''] },
  { clave: 'hoy', texto: 'Hoy', calcular: () => [aISO(new Date()), aISO(new Date())] },
  { clave: '7', texto: '7 días', calcular: () => [aISO(haceDias(6)), aISO(new Date())] },
  { clave: '15', texto: '15 días', calcular: () => [aISO(haceDias(14)), aISO(new Date())] },
  { clave: '30', texto: '30 días', calcular: () => [aISO(haceDias(29)), aISO(new Date())] },
  {
    clave: 'mes',
    texto: 'Este mes',
    calcular: () => {
      const hoy = new Date();
      return [aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), aISO(hoy)];
    },
  },
] as const;

type ClaveRango = (typeof RANGOS)[number]['clave'] | 'personalizado';

const numero = (v: string | number | null | undefined) => Number(v ?? 0);
const FILAS_POR_PAGINA = 8;

/**
 * Operacion en campo.
 *
 * Antes esto eran dos pantallas separadas, Personas y Auditoria Conflictos, y
 * para saber quien tomo una encuesta o como se resolvio un choque habia que
 * saltar de una a la otra cargando el numero de documento en la cabeza. Aqui la
 * lista y el detalle conviven: al elegir una persona, su historial completo
 * -cada version, quien la capturo, con que celular y, si hubo conflicto, que
 * campos chocaron y quien lo resolvio- se abre al lado sin navegar.
 */
export default function OperacionPage() {
  const toast = useToast();

  // La persona abierta y el filtro viven en la URL: el enlace a un caso
  // concreto se puede pegar en un chat y llega a la misma vista.
  const [params, setParams] = useSearchParams();
  const seleccionada = params.get('doc');
  const filtro = (params.get('ver') ?? 'todas') as ClaveFiltro;

  const [busqueda, setBusqueda] = useState('');
  const [exportando, setExportando] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rango, setRango] = useState<ClaveRango>('todo');
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(() => api.getPersonas() as Promise<Persona[]>, []);
  const { datos, cargando, error, recargar } = useRecurso<Persona[]>(cargar);

  const panelDetalle = useRef<HTMLElement>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [errorFicha, setErrorFicha] = useState('');

  useEffect(() => {
    if (!seleccionada) {
      setFicha(null);
      setErrorFicha('');
      return;
    }

    let vigente = true;
    setCargandoFicha(true);
    setErrorFicha('');

    api
      .getHistorialPersona(seleccionada)
      .then((r) => {
        // Al cambiar de persona rapido, la respuesta lenta de la anterior no
        // debe pisar a la que el usuario esta mirando ahora.
        if (vigente) setFicha(r as Ficha);
      })
      .catch((e: unknown) => {
        if (vigente) setErrorFicha(e instanceof Error ? e.message : 'No se pudo cargar el historial');
      })
      .finally(() => {
        if (vigente) setCargandoFicha(false);
      });

    return () => {
      vigente = false;
    };
  }, [seleccionada]);

  // El documento cuyo detalle ya se trajo a pantalla, para no repetir el salto
  // en cada recarga del historial.
  const yaDesplazado = useRef<string | null>(null);

  useEffect(() => {
    if (!seleccionada) {
      yaDesplazado.current = null;
      return;
    }
    // El salto espera a que el historial este pintado. Hacerlo al elegir la
    // fila no servia: en ese instante el panel solo tiene la cabecera, es
    // demasiado corto para llegar arriba del todo y el navegador lo dejaba
    // asomando por el borde inferior.
    if (cargandoFicha || !ficha || !panelDetalle.current) return;
    if (yaDesplazado.current === seleccionada) return;
    if (!window.matchMedia('(max-width: 1100px)').matches) return;

    yaDesplazado.current = seleccionada;
    panelDetalle.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [seleccionada, cargandoFicha, ficha]);

  const abrir = (documento: string | null) => {
    const siguiente = new URLSearchParams(params);
    if (documento) siguiente.set('doc', documento);
    else siguiente.delete('doc');
    setParams(siguiente, { replace: true });
  };

  const cambiarFiltro = (clave: ClaveFiltro) => {
    const siguiente = new URLSearchParams(params);
    if (clave === 'todas') siguiente.delete('ver');
    else siguiente.set('ver', clave);
    setParams(siguiente, { replace: true });
  };

  /** Un clic fija las dos fechas; no hay boton de aplicar. */
  const elegirRango = (clave: ClaveRango) => {
    setRango(clave);
    if (clave === 'personalizado') return;
    const [inicio, fin] = RANGOS.find((r) => r.clave === clave)!.calcular();
    setDesde(inicio);
    setHasta(fin);
  };

  /** Tocar el calendario a mano deja de corresponder a ningun atajo. */
  const ajustarFecha = (extremo: 'desde' | 'hasta', valor: string) => {
    setRango('personalizado');
    if (extremo === 'desde') setDesde(valor);
    else setHasta(valor);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setDesde('');
    setHasta('');
    setRango('todo');
    cambiarFiltro('todas');
  };

  const personas = useMemo(() => {
    const lista = Array.isArray(datos) ? datos : [];
    const termino = busqueda.trim().toLowerCase();

    return lista.filter((p) => {
      if (filtro === 'conflicto' && numero(p.conflictos) === 0) return false;
      if (filtro === 'actualizadas' && numero(p.versiones) < 2) return false;
      // El API entrega timestamps ISO; comparar el dia evita que la hora de
      // captura excluya una encuesta del mismo dia elegido en el calendario.
      const fecha = p.ultima_encuesta?.slice(0, 10) ?? '';
      if (desde && (!fecha || fecha < desde)) return false;
      if (hasta && (!fecha || fecha > hasta)) return false;
      if (!termino) return true;

      return [p.nombres, p.apellidos, p.numero_documento, p.municipio, p.ultimo_encuestador]
        .some((campo) => String(campo ?? '').toLowerCase().includes(termino));
    });
  }, [datos, busqueda, filtro, desde, hasta]);

  // Los filtros se aplican mientras se escribe o se elige una fecha. Volver a
  // la primera pagina evita el callejon sin salida de quedar en una pagina que
  // ya no existe despues de acotar los resultados.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtro, desde, hasta]);

  const totalPaginas = Math.max(1, Math.ceil(personas.length / FILAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * FILAS_POR_PAGINA;
  const personasPagina = personas.slice(inicioPagina, inicioPagina + FILAS_POR_PAGINA);

  /** Hay algo acotando la lista, sea del tipo que sea. */
  const hayFiltro = Boolean(busqueda.trim()) || filtro !== 'todas' || Boolean(desde) || Boolean(hasta);

  const conConflicto = useMemo(
    () => (Array.isArray(datos) ? datos : []).filter((p) => numero(p.conflictos) > 0).length,
    [datos]
  );

  const exportar = async () => {
    setExportando(true);
    try {
      await api.downloadReport({
        tipo: filtro === 'conflicto' ? 'conflictos' : 'completo',
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      toast.exito('Reporte descargado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el reporte');
    } finally {
      setExportando(false);
    }
  };

  const columnas: Columna<Persona>[] = [
    {
      clave: 'persona',
      encabezado: 'Persona',
      celda: (p) => (
        <span className={estilos.celdaPersona}>
          <span className={estilos.nombre}>
            {p.nombres} {p.apellidos}
          </span>
          <span className={estilos.documento}>
            {p.tipo_documento ?? 'CC'} {p.numero_documento}
          </span>
        </span>
      ),
    },
    {
      clave: 'municipio',
      encabezado: 'Municipio',
      celda: (p) =>
        p.municipio ? (
          <span>
            {p.municipio}
            {p.departamento && <span className={estilos.tenue}> · {p.departamento}</span>}
          </span>
        ) : (
          <span className={estilos.tenue}>Sin registrar</span>
        ),
    },
    {
      clave: 'encuestador',
      encabezado: 'Última captura',
      celda: (p) => (
        <span className={estilos.celdaPersona}>
          <span>{p.ultimo_encuestador ?? <span className={estilos.tenue}>Sin encuestador</span>}</span>
          <span className={estilos.documento}>{formatearRelativo(p.ultima_encuesta, 'Sin encuestas')}</span>
        </span>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Versiones',
      celda: (p) => (
        <span className={estilos.celdaEstado}>
          <span className={estilos.versiones}>{numero(p.versiones)}</span>
          {numero(p.conflictos) > 0 && (
            <Badge tono="ambar">
              <AlertTriangle size={11} aria-hidden="true" />
              {numero(p.conflictos)} conflicto{numero(p.conflictos) > 1 ? 's' : ''}
            </Badge>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className={estilos.pagina}>
      <PageHeader
        titulo="Operación en campo"
        subtitulo={
          cargando
            ? 'Cargando el consolidado…'
            : `${personas.length} de ${(datos ?? []).length} personas · ${conConflicto} con conflicto resuelto`
        }
        acciones={
          <>
            <SearchInput
              valor={busqueda}
              onCambio={setBusqueda}
              etiqueta="Buscar persona, municipio o encuestador"
              placeholder="Buscar…"
            />
            <IconButton etiqueta="Exportar a CSV" onClick={exportar} disabled={exportando}>
              <Download size={16} />
            </IconButton>
            <IconButton etiqueta="Actualizar datos" onClick={recargar} disabled={cargando}>
              <RefreshCcw size={16} className={cargando ? estilos.girando : undefined} />
            </IconButton>
          </>
        }
      />

      <div className={estilos.filtros} role="group" aria-label="Filtrar el consolidado">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.clave}
            type="button"
            className={`${estilos.filtro} ${filtro === opcion.clave ? estilos.filtroActivo : ''}`}
            onClick={() => cambiarFiltro(opcion.clave)}
            aria-pressed={filtro === opcion.clave}
          >
            {opcion.texto}
          </button>
        ))}

        <span className={estilos.separador} aria-hidden="true" />

        {RANGOS.map((opcion) => (
          <button
            key={opcion.clave}
            type="button"
            className={`${estilos.filtro} ${rango === opcion.clave ? estilos.filtroActivo : ''}`}
            onClick={() => elegirRango(opcion.clave)}
            aria-pressed={rango === opcion.clave}
          >
            {opcion.texto}
          </button>
        ))}

        <button
          type="button"
          className={`${estilos.filtro} ${rango === 'personalizado' ? estilos.filtroActivo : ''}`}
          onClick={() => elegirRango('personalizado')}
          aria-pressed={rango === 'personalizado'}
        >
          <CalendarDays size={14} aria-hidden="true" /> Otro
        </button>

        {hayFiltro && (
          <button type="button" className={estilos.limpiar} onClick={limpiarFiltros}>
            <RotateCcw size={14} aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      {/* El calendario solo aparece si se pide: para la pregunta habitual
          sobran los atajos, y dos campos de fecha permanentes son estorbo. */}
      {rango === 'personalizado' && (
        <div className={estilos.fechas}>
          <label className={estilos.fecha}>
            <span>Desde</span>
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => ajustarFecha('desde', e.target.value)}
              aria-label="Mostrar capturas desde esta fecha"
            />
          </label>
          <label className={estilos.fecha}>
            <span>Hasta</span>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => ajustarFecha('hasta', e.target.value)}
              aria-label="Mostrar capturas hasta esta fecha"
            />
          </label>
        </div>
      )}

      <div className={`${estilos.division} ${seleccionada ? estilos.conDetalle : ''}`}>
        <div className={estilos.lista}>
          <DataTable
            etiqueta="Personas encuestadas"
            columnas={columnas}
            filas={personasPagina}
            claveFila={(p) => p.numero_documento}
            cargando={cargando}
            error={error}
            vacio={hayFiltro ? 'Nadie coincide con el filtro' : 'Todavía no hay personas encuestadas'}
            onFilaClick={(p) => abrir(p.numero_documento)}
            filaActiva={(p) => p.numero_documento === seleccionada}
          />

          {!cargando && !error && personas.length > 0 && (
            <nav className={estilos.paginacion} aria-label="Paginación de personas">
              <span className={estilos.rango}>
                {inicioPagina + 1}–{Math.min(inicioPagina + FILAS_POR_PAGINA, personas.length)} de {personas.length}
              </span>
              <div className={estilos.controlesPagina}>
                <button
                  type="button"
                  onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
                  disabled={paginaSegura === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Anterior
                </button>
                <span className={estilos.numeroPagina} aria-current="page">
                  {paginaSegura} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
                  disabled={paginaSegura === totalPaginas}
                  aria-label="Página siguiente"
                >
                  Siguiente <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </div>

        {seleccionada && (
          <aside
            ref={panelDetalle}
            className={estilos.detalle}
            aria-label="Historial de la persona"
          >
            <header className={estilos.detalleCabecera}>
              <div>
                <h2 className={estilos.detalleTitulo}>
                  {ficha ? `${ficha.persona.nombres} ${ficha.persona.apellidos}` : 'Cargando…'}
                </h2>
                <p className={estilos.detalleSub}>
                  {ficha?.persona.tipo_documento ?? 'CC'} {seleccionada}
                </p>
              </div>
              <IconButton etiqueta="Cerrar el detalle" onClick={() => abrir(null)}>
                <X size={16} />
              </IconButton>
            </header>

            {cargandoFicha && <p className={estilos.aviso}>Cargando el historial…</p>}

            {errorFicha && (
              <p className={estilos.error} role="alert">
                <AlertTriangle size={16} aria-hidden="true" /> {errorFicha}
              </p>
            )}

            {ficha && !cargandoFicha && (
              <>
                <dl className={estilos.ficha}>
                  {[
                    ['Municipio', ficha.persona.municipio],
                    ['Teléfono', ficha.persona.telefono],
                    ['EPS', ficha.persona.eps],
                    ['Ocupación', ficha.persona.ocupacion],
                    ['Estrato', ficha.persona.estrato],
                    ['Versión', ficha.persona.sync_version],
                  ].map(([etiqueta, valor]) => (
                    <div key={String(etiqueta)} className={estilos.fichaItem}>
                      <dt>{etiqueta}</dt>
                      <dd>
                        {valor === null || valor === undefined || valor === ''
                          ? <span className={estilos.tenue}>Sin registrar</span>
                          : String(valor)}
                      </dd>
                    </div>
                  ))}
                </dl>

                <h3 className={estilos.seccion}>
                  Historial de capturas
                  <span className={estilos.contador}>{ficha.historial.length}</span>
                </h3>

                <ol className={estilos.linea}>
                  {ficha.historial.map((v, indice) => (
                    <li key={v.id_encuesta} className={estilos.hito}>
                      <span
                        className={`${estilos.marca} ${v.tuvo_conflicto ? estilos.marcaConflicto : ''}`}
                        aria-hidden="true"
                      />

                      <div className={estilos.hitoCabecera}>
                        <span className={estilos.hitoVersion}>
                          {/* El historial llega de mas reciente a mas antigua. */}
                          v{ficha.historial.length - indice}
                          {v.es_actualizacion ? ' · actualización' : ' · captura inicial'}
                        </span>
                        <span className={estilos.hitoFecha}>{formatearFecha(v.fecha_encuesta)}</span>
                      </div>

                      <p className={estilos.hitoAutor}>
                        <UserRound size={13} aria-hidden="true" />
                        {v.encuestador ?? 'Encuestador desconocido'}
                        {v.dispositivo_id && (
                          <>
                            <Smartphone size={13} aria-hidden="true" />
                            <span className={estilos.mono}>{v.dispositivo_id}</span>
                          </>
                        )}
                      </p>

                      {v.tuvo_conflicto && (
                        <ResolucionConflicto
                          campos={v.campos_en_conflicto}
                          resueltoPor={v.resuelto_por}
                        />
                      )}

                      <details className={estilos.datos}>
                        <summary>Ver los datos capturados</summary>
                        <dl className={estilos.datosLista}>
                          {Object.entries(v.datos_recolectados ?? {}).map(([campo, valor]) => (
                            <div key={campo}>
                              <dt>{campo}</dt>
                              <dd>
                                {valor === null || valor === '' ? (
                                  <span className={estilos.tenue}>sin dato</span>
                                ) : (
                                  String(valor)
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
