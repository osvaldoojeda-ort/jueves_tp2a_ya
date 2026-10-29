import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import {
  createBookSchema,
  updateBookSchema,
  queryBooksSchema,
  queryBookByIdSchema,
  bookIdParamSchema,
} from "../schemas/bookSchema.js";

/**
 * Factory de Router para Libros.
 * Recibe el controlador ya instanciado (con los casos de uso inyectados) y los middlewares de auth.
 * Lectura pública; escritura solo para administradores.
 */
function createBooksRouter(controller, { authenticate, authorize }) {
  const router = express.Router();

  router.get("/", validateQuery(queryBooksSchema), controller.list);
  router.get("/:id", validateParams(bookIdParamSchema), validateQuery(queryBookByIdSchema), controller.get);
  router.post("/", authenticate, authorize("admin"), validate(createBookSchema), controller.create);
  router.put("/:id", authenticate, authorize("admin"), validateParams(bookIdParamSchema), validate(updateBookSchema), controller.update);
  router.delete("/:id", authenticate, authorize("admin"), validateParams(bookIdParamSchema), controller.remove);

  return router;
}

export default createBooksRouter;
