import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import {
  createBookSchema,
  updateBookSchema,
  queryBooksSchema,
  queryBookByIdSchema,
  bookIdParamSchema,
  importBooksSchema, // ← NUEVO
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
    // ← NUEVO (Clase 12). Solo autenticados: cada pedido gasta una consulta a una API de terceros
  router.get("/:id/details", auth.authenticate, validateParams(bookIdParamSchema), controller.details);
  router.post("/import", ...onlyAdmin, validate(importBooksSchema), controller.import);
  router.get("/:id", validateParams(bookIdParamSchema), validateQuery(queryBookByIdSchema), controller.get);

  // Solo admin
  router.post("/", ...onlyAdmin, validate(createBookSchema), controller.create);
  router.put("/:id", ...onlyAdmin, validateParams(bookIdParamSchema), validate(updateBookSchema), controller.update);
  router.delete("/:id", ...onlyAdmin, validateParams(bookIdParamSchema), controller.remove);

  return router;
}

export default createBooksRouter;
