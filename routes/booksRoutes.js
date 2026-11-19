import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import {
  createBookSchema,
  updateBookSchema,
  queryBooksSchema,
  queryBookByIdSchema,
  bookIdParamSchema,
  importBooksSchema, // ← NUEVO
  exportBooksQuerySchema, // ← NUEVO
} from "../schemas/bookSchema.js";

/**
 * Factory de Router para Libros.
 * Recibe el controlador ya instanciado (con los casos de uso inyectados) y configura los endpoints.
 */
function createBooksRouter(controller, auth) { // ← NUEVO: auth
  const router = express.Router();
  const onlyAdmin = [auth.authenticate, auth.authorize("admin")]; // ← NUEVO

  // Públicos
  router.get("/", validateQuery(queryBooksSchema), controller.list);
    // ← NUEVO (Clase 12). Ej. 6.6 — ¿Qué pasaría si "/export.csv" se declarara DESPUÉS de "/:id"?
  // Express prueba las rutas en el orden en que se declaran, y "/:id" acepta cualquier texto, incluido
  // "export.csv". La validación del id (número entero) respondería un 400 confuso y la exportación nunca
  // se ejecutaría. Por eso las rutas fijas van antes que las que tienen parámetros.
  router.get("/export.csv", ...onlyAdmin, validateQuery(exportBooksQuerySchema), controller.exportCsv);
  // ← NUEVO (Clase 12). Solo autenticados: cada pedido gasta una consulta a una API de terceros
  router.post("/import", ...onlyAdmin, validate(importBooksSchema), controller.import);
  router.get("/:id/details", auth.authenticate, validateParams(bookIdParamSchema), controller.details);
  router.get("/:id", validateParams(bookIdParamSchema), validateQuery(queryBookByIdSchema), controller.get);

  // Solo admin
  router.post("/", ...onlyAdmin, validate(createBookSchema), controller.create);
  router.put("/:id", ...onlyAdmin, validateParams(bookIdParamSchema), validate(updateBookSchema), controller.update);
  router.delete("/:id", ...onlyAdmin, validateParams(bookIdParamSchema), controller.remove);

  return router;
}

export default createBooksRouter;
