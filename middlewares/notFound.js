import AppError from "../errors/AppError.js";

/**
 * Se monta después de todos los routers: si la request llegó acá, ninguna ruta matcheó.
 * En vez de responder directo, deriva un AppError al errorHandler (así el formato sale de un solo lugar).
 */
function notFound(req, res, next) {
  next(new AppError("ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} does not exist`, 404));
}

export default notFound;
