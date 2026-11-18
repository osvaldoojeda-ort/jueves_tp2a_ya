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

/*
 * Ej. 10.4 — Si un admin es eliminado, su token sigue valiendo hasta que vence. ¿Cómo evitarlo?
 * El JWT es "stateless": authenticate solo verifica la firma y la fecha, no consulta la base.
 * Opción: que authenticate reciba el usersDao y, después de verificar el token, haga
 * usersDao.getById(payload.sub). Si el usuario ya no existe -> 401. Y de paso se toma el rol
 * ACTUAL de la base y no el del token (si al admin lo bajaron a lector, deja de ser admin al instante).
 * Costo: una consulta a la base en CADA request protegido. Se pierde la gran ventaja del JWT
 * (validar sin ir a la base), suma latencia y carga a la BD, y authenticate pasa a depender del DAO.
 * Alternativas más livianas: tokens de vida corta (ej. 15 min) + refresh token, o una "lista negra"
 * de tokens/usuarios revocados en memoria o en Redis (igual es estado que hay que mantener).
 */

export default createAuthMiddlewares;
