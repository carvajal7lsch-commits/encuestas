import { Request, Response, NextFunction } from 'express';

/**
 * Autorizacion por rol.
 *
 * authMiddleware solo comprueba que el token sea valido, no quien lo firma. Las
 * rutas de /api/admin se montaban unicamente con el, asi que cualquier cuenta
 * autenticada -incluido un encuestador desde la app- podia leer el consolidado
 * completo, el historial de cualquier persona y la lista de usuarios, y ademas
 * crear cuentas nuevas con rol admin. Escalada de privilegios de un solo POST.
 *
 * Se usa siempre despues de authMiddleware, que es quien rellena req.user.
 */
export const requiereRol = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rol = req.user?.rol;

    if (!rol) {
      // Sin usuario en la peticion el orden de los middlewares esta mal: se
      // responde 401 y no se deja pasar por si acaso.
      res.status(401).json({ error: 'Falta el token de autorizacion' });
      return;
    }

    if (!roles.includes(rol)) {
      res.status(403).json({ error: 'Tu cuenta no tiene permiso para esta operacion' });
      return;
    }

    next();
  };
};
