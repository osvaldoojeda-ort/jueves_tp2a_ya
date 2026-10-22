import AppError from "../errors/AppError.js";

/**
 * Middleware factory flexible para validar req.body, req.query o req.params utilizando Zod.
 * @param {import("zod").ZodSchema} schema 
 * @param {"body" | "query" | "params"} target 
 */
function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      }));
      return next(new AppError("VALIDATION_ERROR", `Datos de ${target} inválidos`, 400, details));
    }

    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      // En Express 5 `req.query` es un getter que se recalcula en cada acceso: mutarlo no persiste.
      // Se redefine como propiedad propia para que los controladores reciban los valores ya parseados.
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
    } else if (req[target] && typeof req[target] === "object") {
      Object.assign(req[target], result.data);
    }
    next();
  };
}

export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");
export default validate;
