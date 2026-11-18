import AppError from "../errors/AppError.js";

/**
 * Manejador central de errores (Ej. 2).
 * Express lo reconoce como error handler porque tiene 4 parámetros: (err, req, res, next).
 * Es el ÚNICO lugar de la app que arma respuestas de error.
 */
function errorHandler(err, req, res, next) {
  // Error esperado: lo lanzamos nosotros con AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }), // details solo si existe
      },
    });
  }

  // Error inesperado (un bug): log completo para nosotros, mensaje genérico para el cliente
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

export default errorHandler;
