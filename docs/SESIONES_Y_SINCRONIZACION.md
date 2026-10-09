# Sesión persistente y sincronización — APK 1.3.0

El JWT sigue durando 8 horas. Android solicita una sesión persistente al iniciar
sesión y almacena una credencial de renovación protegida con Android Keystore
(AES-GCM). La contraseña no se guarda. La renovación funciona durante 30 días
desde el login; después se solicita un nuevo login. No se anuncia una subida
exitosa hasta recibir una respuesta del servidor.

## Preparar el servidor

El backend aplica `backend/migrations/20261009_sesiones_refresh.sql` al arrancar,
antes de aceptar peticiones. El SQL se incluye también en la imagen Docker.
Si falla la migración, el proceso termina con error y no sirve una API incompleta.
Para aplicarla manualmente: `cd backend; npm run migrate:sessions`.
La migración es aditiva e idempotente y no modifica las encuestas existentes.
Instalaciones nuevas incluyen la tabla en `db/init.sql`.

El login antiguo conserva `{ token, usuario }`. El móvil agrega
`sesion_persistente: true` y recibe también `{ refreshToken, refreshExpiresAt }`.
`POST /api/auth/refresh` recibe `{ refreshToken }` y devuelve un nuevo `{ token }`.
El servidor guarda únicamente SHA-256 de la credencial y una huella del hash de
contraseña. No permite renovar sesiones vencidas/revocadas, usuarios inactivos
ni sesiones anteriores a un restablecimiento de contraseña. Usa el rol actual.
`POST /api/auth/logout` revoca la credencial. Los JWT ya emitidos vencen a las
8 horas; no se implementa revocación inmediata de esos JWT.

## Actualización móvil

Generar APK release con la misma firma que 1.2.0. No desinstalar ni borrar datos.
La primera vez que venza una sesión heredada, la app pide un login para obtener
su primera credencial de renovación. La cola Room se conserva sin migraciones.
Desplegar backend primero, luego APK. Publicar `app-version.json` únicamente
después de que la APK firmada esté disponible; no se cambia el manifiesto público
durante el desarrollo.

## Estados y recuperación

- Guardada: la encuesta quedó en Room y en la cola, dentro de una transacción.
- Esperando internet: no hay red validada. WorkManager espera/reintenta.
- Enviando: hay trabajo en ejecución y encuestas pendientes.
- Recibida: HTTP 2xx o el 409 definitivo del contrato actual (fusión/duplicado).
- Necesita login: la renovación recibió 401, el acceso 403 o no existe renovación.
  Se muestra una acción directa; el acceso offline permanece para seguir capturando.
- Revisión: payload ilegible o rechazo 4xx definitivo. No se borra la encuesta ni
  se reintenta indefinidamente. Se informa que necesita revisión.

Los fallos de red y 5xx al renovar conservan las credenciales, y los pendientes
se reintentan con backoff. Todos los disparadores usan la cola única del scheduler;
un mutex impide ejecuciones simultáneas del trabajo periódico y del inmediato.
El cierre de sesión elimina credenciales incluso sin internet. Si está offline,
la credencial remota permanece válida hasta vencer, pero su copia local se elimina.

## Verificación de campo

1. Actualizar backend y APK, iniciar sesión con la misma cuenta del encuestador.
2. Quitar internet, guardar encuesta: debe indicar guardada/esperando internet.
3. Restablecer internet: confirmar que pasa a recibida y aparece en el panel.
4. Repetir con JWT vencido y renovación vigente: debe enviar sin pedir login.
5. Revocar la sesión o cambiar contraseña: debe pedir login y conservar pendientes.
6. Apagar la app/reiniciar el teléfono con pendientes; confirmar recuperación.
7. Interrumpir internet durante renovación: no debe cerrar sesión ni perder datos.
8. Cerrar sesión durante renovación: una respuesta tardía no restaura credenciales.

Las pruebas automáticas cubren emisión/renovación/revocación del backend,
reintento HTTP del interceptor, fallos temporales y etiquetas de estado. Estas
pruebas no sustituyen la verificación en un teléfono real de restricciones de
batería, conectividad y continuidad de la instalación firmada.
