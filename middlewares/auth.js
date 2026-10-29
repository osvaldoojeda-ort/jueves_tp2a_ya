import AppError from "../errors/AppError.js";

/**
 * Middlewares de autenticación y autorización.
 * Se construyen con una factory porque necesitan el servicio de tokens (se inyecta desde el contenedor).
 *
 *  - authenticate: ¿quién sos? Lee "Authorization: Bearer <token>", lo verifica y deja `req.user`.
 *  - authorize(...roles): ¿tenés permiso? Corta con 403 si el rol de `req.user` no está permitido.
 *
 * Limitación conocida: un token firmado sigue valiendo hasta su vencimiento aunque el usuario haya sido
 * eliminado o cambiado de rol. Se podría consultar la BD en cada request (authenticate buscaría al usuario y
 * rechazaría si no existe o cambió su rol), pero se pierde la gracia de JWT: ya no es "sin estado" y cada
 * request paga una consulta. Alternativas: vida corta del token, refresh tokens o una lista de tokens revocados.
 */
function createAuthMiddlewares(tokens) {
  function authenticate(req, res, next) {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next(new AppError("TOKEN_MISSING", "Falta el header Authorization: Bearer <token>", 401));
    }

    try {
      const { sub, rol } = tokens.verify(token);
      req.user = { id: Number(sub), rol };
      next();
    } catch (err) {
      next(err);
    }
  }

  const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return next(new AppError("FORBIDDEN", "No tenés permiso para realizar esta acción", 403));
    }
    next();
  };

  return { authenticate, authorize };
}

export default createAuthMiddlewares;
