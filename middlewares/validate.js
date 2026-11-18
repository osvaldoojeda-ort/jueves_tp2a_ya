import AppError from "../errors/AppError.js";

// Convierte los issues de Zod en [{ field, message }]
function toDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/**
 * Factory de middleware de validación para req.body (Ej. 4).
 * Recibe un schema y devuelve un middleware que lo aplica.
 * Si pasa, reemplaza req.body por los datos limpios (con los defaults aplicados).
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError("VALIDATION_ERROR", "Invalid data", 400, toDetails(result.error)));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Desafío: lo mismo para req.query.
 * En Express 5 req.query es de solo lectura, así que el resultado se guarda en req.pagination.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError("VALIDATION_ERROR", "Invalid query params", 400, toDetails(result.error)));
    }
    req.pagination = result.data;
    next();
  };
}

export default validate;
export { validateQuery };
