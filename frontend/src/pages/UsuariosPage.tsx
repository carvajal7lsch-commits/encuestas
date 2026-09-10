import { useCallback, useId, useMemo, useState } from 'react';
import {
  UserPlus,
  Power,
  RefreshCcw,
  Pencil,
  KeyRound,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/api';
import { useRecurso } from '../hooks/useRecurso';
import { leerUsuario } from '../services/sesion';
import { formatearDia } from '../utils/fecha';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  IconButton,
  Modal,
  PageHeader,
  SearchInput,
  useToast,
  type Columna,
} from '../components/ui';
import estilos from './UsuariosPage.module.css';

interface Usuario {
  id_usuario: number;
  numero_documento: string;
  nombre_completo: string;
  email: string | null;
  rol: string;
  dispositivo_id: string | null;
  activo: boolean;
  creado_en: string;
}

const ROLES = [
  { valor: 'encuestador', texto: 'Encuestador' },
  { valor: 'supervisor', texto: 'Supervisor' },
  { valor: 'admin', texto: 'Administrador' },
];

const FORM_VACIO = {
  numero_documento: '',
  nombre_completo: '',
  email: '',
  password: '',
  rol: 'encuestador',
  dispositivo_id: '',
};

type Formulario = typeof FORM_VACIO;

/**
 * Encuestadores.
 *
 * El CRUD estaba a medias: solo sabia crear y encender/apagar. Un nombre mal
 * escrito, un cambio de rol o un celular reasignado obligaban a abandonar la
 * cuenta y hacer otra, y no habia forma de reasignar una contrasena olvidada.
 * Ademas el alta nunca enviaba el correo ni el dispositivo, que llevan en el
 * esquema desde el principio.
 *
 * La baja definitiva solo procede si la cuenta no firma encuestas: el historial
 * es inmutable y borrar a su autor destruiria la auditoria. El servidor lo
 * rechaza con un mensaje que dice justamente eso.
 */
export default function UsuariosPage() {
  const toast = useToast();
  const idFormulario = useId();
  const yo = leerUsuario();

  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState<Formulario>(FORM_VACIO);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  const [claveDe, setClaveDe] = useState<Usuario | null>(null);
  const [claveNueva, setClaveNueva] = useState('');

  const [porAlternar, setPorAlternar] = useState<Usuario | null>(null);
  const [porEliminar, setPorEliminar] = useState<Usuario | null>(null);

  const cargar = useCallback(() => api.getUsuarios() as Promise<Usuario[]>, []);
  const { datos, cargando, error, recargar } = useRecurso<Usuario[]>(cargar);

  const usuarios = useMemo(() => {
    const lista = Array.isArray(datos) ? datos : [];
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return lista;

    return lista.filter((u) =>
      [u.numero_documento, u.nombre_completo, u.email, u.dispositivo_id].some((campo) =>
        String(campo ?? '').toLowerCase().includes(termino)
      )
    );
  }, [datos, busqueda]);

  const esMiCuenta = (u: Usuario) => u.id_usuario === yo.id_usuario;

  const abrirAlta = () => {
    setEditando(null);
    setFormulario(FORM_VACIO);
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const abrirEdicion = (u: Usuario) => {
    setEditando(u);
    setFormulario({
      numero_documento: u.numero_documento,
      nombre_completo: u.nombre_completo,
      email: u.email ?? '',
      password: '',
      rol: u.rol,
      dispositivo_id: u.dispositivo_id ?? '',
    });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setFormulario(FORM_VACIO);
    setErrorFormulario('');
  };

  const guardar = async () => {
    if (!formulario.nombre_completo.trim()) {
      setErrorFormulario('El nombre es obligatorio.');
      return;
    }
    if (!editando && !formulario.numero_documento.trim()) {
      setErrorFormulario('El documento es obligatorio.');
      return;
    }
    if (!editando && formulario.password.length < 6) {
      setErrorFormulario('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setGuardando(true);
    setErrorFormulario('');
    try {
      if (editando) {
        await api.updateUsuario(editando.id_usuario, {
          nombre_completo: formulario.nombre_completo,
          email: formulario.email,
          rol: formulario.rol,
          dispositivo_id: formulario.dispositivo_id,
        });
        toast.exito('Cuenta actualizada.');
      } else {
        await api.createUsuario(formulario);
        toast.exito('Cuenta creada.');
      }
      cerrarModal();
      recargar();
    } catch (e) {
      // El error se queda dentro del formulario: sacarlo a un aviso flotante
      // obliga a recordarlo mientras se corrige el campo.
      setErrorFormulario(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const reasignarClave = async () => {
    if (!claveDe) return;
    if (claveNueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await api.resetPasswordUsuario(claveDe.id_usuario, claveNueva);
      toast.exito(`Contraseña reasignada a ${claveDe.nombre_completo}.`);
      setClaveDe(null);
      setClaveNueva('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo reasignar la contraseña');
    }
  };

  const alternar = async () => {
    if (!porAlternar) return;
    try {
      await api.toggleUsuario(porAlternar.id_usuario);
      toast.exito(porAlternar.activo ? 'Cuenta desactivada.' : 'Cuenta activada.');
      recargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar el estado');
    } finally {
      setPorAlternar(null);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await api.deleteUsuario(porEliminar.id_usuario);
      toast.exito('Cuenta eliminada.');
      recargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta');
    } finally {
      setPorEliminar(null);
    }
  };

  const columnas: Columna<Usuario>[] = [
    {
      clave: 'persona',
      encabezado: 'Cuenta',
      celda: (u) => (
        <span className={estilos.celda}>
          <span className={estilos.nombre}>
            {u.nombre_completo}
            {esMiCuenta(u) && <span className={estilos.tuya}>tú</span>}
          </span>
          <span className={estilos.secundario}>
            {u.numero_documento}
            {u.email && ` · ${u.email}`}
          </span>
        </span>
      ),
    },
    {
      clave: 'rol',
      encabezado: 'Rol',
      celda: (u) => (
        <Badge tono={u.rol === 'admin' ? 'violeta' : u.rol === 'supervisor' ? 'azul' : 'neutro'}>
          {ROLES.find((r) => r.valor === u.rol)?.texto ?? u.rol}
        </Badge>
      ),
    },
    {
      clave: 'dispositivo',
      encabezado: 'Dispositivo',
      celda: (u) =>
        u.dispositivo_id ? (
          <span className={estilos.dispositivo}>
            <Smartphone size={13} aria-hidden="true" />
            <span className={estilos.mono}>{u.dispositivo_id}</span>
          </span>
        ) : (
          <span className={estilos.tenue}>Sin asignar</span>
        ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (u) => (
        <span className={estilos.celda}>
          <Badge tono={u.activo ? 'verde' : 'rojo'}>{u.activo ? 'Activa' : 'Inactiva'}</Badge>
          <span className={estilos.secundario}>desde {formatearDia(u.creado_en)}</span>
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      derecha: true,
      celda: (u) => (
        <span className={estilos.acciones}>
          <IconButton etiqueta={`Editar a ${u.nombre_completo}`} tamano="sm" onClick={() => abrirEdicion(u)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton
            etiqueta={`Reasignar la contraseña de ${u.nombre_completo}`}
            tamano="sm"
            onClick={() => {
              setClaveDe(u);
              setClaveNueva('');
            }}
          >
            <KeyRound size={15} />
          </IconButton>
          <IconButton
            etiqueta={`${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre_completo}`}
            tamano="sm"
            /* El servidor tambien lo impide; aqui se desactiva el control para
               no ofrecer una accion que va a fallar. */
            disabled={esMiCuenta(u)}
            onClick={() => setPorAlternar(u)}
          >
            <Power size={15} />
          </IconButton>
          <IconButton
            etiqueta={`Eliminar a ${u.nombre_completo}`}
            tamano="sm"
            disabled={esMiCuenta(u)}
            onClick={() => setPorEliminar(u)}
          >
            <Trash2 size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <div className={estilos.pagina}>
      <PageHeader
        titulo="Encuestadores"
        subtitulo={
          cargando
            ? 'Cargando las cuentas…'
            : `${usuarios.length} cuenta${usuarios.length === 1 ? '' : 's'} · ${(datos ?? []).filter((u) => u.activo).length} activa(s)`
        }
        acciones={
          <>
            <SearchInput
              valor={busqueda}
              onCambio={setBusqueda}
              etiqueta="Buscar por nombre, documento, correo o dispositivo"
              placeholder="Buscar…"
            />
            <IconButton etiqueta="Actualizar la lista" onClick={recargar} disabled={cargando}>
              <RefreshCcw size={16} className={cargando ? estilos.girando : undefined} />
            </IconButton>
            <Button onClick={abrirAlta}>
              <UserPlus size={15} aria-hidden="true" />
              Nueva cuenta
            </Button>
          </>
        }
      />

      <DataTable
        etiqueta="Cuentas de encuestadores y administradores"
        columnas={columnas}
        filas={usuarios}
        claveFila={(u) => String(u.id_usuario)}
        cargando={cargando}
        error={error}
        vacio={busqueda ? 'Ninguna cuenta coincide con la búsqueda' : 'Todavía no hay cuentas creadas'}
      />

      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar cuenta' : 'Nueva cuenta'}
          descripcion={
            editando
              ? 'La contraseña no se toca aquí; se reasigna con el botón de la llave.'
              : 'La cuenta queda activa y puede entrar de inmediato.'
          }
          onCerrar={cerrarModal}
          pie={
            <>
              <Button variante="secundario" onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cuenta'}
              </Button>
            </>
          }
        >
          <div className={estilos.formulario}>
            {errorFormulario && (
              <p className={estilos.errorFormulario} role="alert">
                {errorFormulario}
              </p>
            )}

            <div className={estilos.campo}>
              <label htmlFor={`${idFormulario}-doc`}>Número de documento</label>
              <input
                id={`${idFormulario}-doc`}
                value={formulario.numero_documento}
                onChange={(e) => setFormulario({ ...formulario, numero_documento: e.target.value })}
                /* El documento es la llave con la que entra: cambiarlo seria
                   otra cuenta, no la misma editada. */
                disabled={Boolean(editando)}
              />
              {editando && <span className={estilos.pista}>El documento no se puede cambiar.</span>}
            </div>

            <div className={estilos.campo}>
              <label htmlFor={`${idFormulario}-nombre`}>Nombre completo</label>
              <input
                id={`${idFormulario}-nombre`}
                value={formulario.nombre_completo}
                onChange={(e) => setFormulario({ ...formulario, nombre_completo: e.target.value })}
              />
            </div>

            <div className={estilos.campo}>
              <label htmlFor={`${idFormulario}-email`}>Correo (opcional)</label>
              <input
                id={`${idFormulario}-email`}
                type="email"
                value={formulario.email}
                onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
              />
            </div>

            <div className={estilos.fila}>
              <div className={estilos.campo}>
                <label htmlFor={`${idFormulario}-rol`}>Rol</label>
                <select
                  id={`${idFormulario}-rol`}
                  value={formulario.rol}
                  onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.valor} value={r.valor}>
                      {r.texto}
                    </option>
                  ))}
                </select>
              </div>

              <div className={estilos.campo}>
                <label htmlFor={`${idFormulario}-disp`}>Dispositivo (opcional)</label>
                <input
                  id={`${idFormulario}-disp`}
                  value={formulario.dispositivo_id}
                  onChange={(e) => setFormulario({ ...formulario, dispositivo_id: e.target.value })}
                  placeholder="ANDROID-JORGE-01"
                />
              </div>
            </div>

            {!editando && (
              <div className={estilos.campo}>
                <label htmlFor={`${idFormulario}-pass`}>Contraseña inicial</label>
                <input
                  id={`${idFormulario}-pass`}
                  type="password"
                  value={formulario.password}
                  onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
                />
                <span className={estilos.pista}>Mínimo 6 caracteres.</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {claveDe && (
        <Modal
          titulo="Reasignar contraseña"
          descripcion={`Se reemplazará la contraseña de ${claveDe.nombre_completo}. La anterior deja de servir.`}
          onCerrar={() => setClaveDe(null)}
          ancho="sm"
          pie={
            <>
              <Button variante="secundario" onClick={() => setClaveDe(null)}>
                Cancelar
              </Button>
              <Button onClick={reasignarClave}>Reasignar</Button>
            </>
          }
        >
          <div className={estilos.campo}>
            <label htmlFor={`${idFormulario}-nueva`}>Contraseña nueva</label>
            <input
              id={`${idFormulario}-nueva`}
              type="password"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
            />
            <span className={estilos.pista}>Mínimo 6 caracteres.</span>
          </div>
        </Modal>
      )}

      {porAlternar && (
        <ConfirmDialog
          titulo={porAlternar.activo ? 'Desactivar la cuenta' : 'Activar la cuenta'}
          mensaje={
            porAlternar.activo
              ? `${porAlternar.nombre_completo} dejará de poder entrar y de sincronizar desde el celular. Sus encuestas ya sincronizadas no se tocan.`
              : `${porAlternar.nombre_completo} volverá a poder entrar y sincronizar.`
          }
          textoConfirmar={porAlternar.activo ? 'Desactivar' : 'Activar'}
          peligroso={porAlternar.activo}
          onConfirmar={alternar}
          onCancelar={() => setPorAlternar(null)}
        />
      )}

      {porEliminar && (
        <ConfirmDialog
          titulo="Eliminar la cuenta"
          mensaje={
            <>
              Se borrará la cuenta de <strong>{porEliminar.nombre_completo}</strong> de forma
              definitiva. Si ya firmó encuestas sincronizadas, el servidor lo impedirá para no
              romper la auditoría; en ese caso la salida es desactivarla.
            </>
          }
          textoConfirmar="Eliminar"
          peligroso
          onConfirmar={eliminar}
          onCancelar={() => setPorEliminar(null)}
        />
      )}
    </div>
  );
}
