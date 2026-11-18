/**
 * Error ESPERADO de la aplicación (Ej. 1).
 * Lleva todo lo que el errorHandler necesita para armar la respuesta:
 *  - code: código estable para el cliente (ej. "BOOK_NOT_FOUND")
 *  - statusCode: código HTTP (por defecto 400)
 *  - details: información extra opcional (ej. los errores de Zod)
 */
class AppError extends Error {
  constructor(code, message, statusCode = 400, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export default AppError;
