import AppError from "../errors/AppError.js";

/**
 * Factory de middlewares de autenticación/autorización.
 * Recibe el servicio de tokens por inyección: este archivo NO conoce jsonwebtoken.
 */
function createAuthMiddlewares(tokens) {
  // Autenticación: lee "Authorization: Bearer <token>" y deja req.user = { id, rol }
  function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
      return next(new AppError("TOKEN_MISSING", "Falta el header Authorization", 401));
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return next(new AppError("TOKEN_INVALID", "Formato esperado: Bearer <token>", 401));
    }

    try {
      const payload = tokens.verify(token); // lanza TOKEN_EXPIRED o TOKEN_INVALID
      req.user = { id: Number(payload.sub), rol: payload.rol };
      next();
    } catch (err) {
      next(err);
    }
  }

  // Autorización: se usa SIEMPRE después de authenticate
  function authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AppError("TOKEN_MISSING", "No autenticado", 401));
      }
      if (!roles.includes(req.user.rol)) {
        return next(new AppError("FORBIDDEN", "No tenés permisos para esta acción", 403));
      }
      next();
    };
  }

  return { authenticate, authorize };
}

export default createAuthMiddlewares;
