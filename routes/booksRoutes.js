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
 * Recibe el controlador ya instanciado (con los casos de uso inyectados) y configura los endpoints.
 */
function createBooksRouter(controller) {
  const router = express.Router();

  router.get("/", validateQuery(queryBooksSchema), controller.list);
  router.get("/:id", validateParams(bookIdParamSchema), validateQuery(queryBookByIdSchema), controller.get);
  router.post("/", validate(createBookSchema), controller.create);
  router.put("/:id", validateParams(bookIdParamSchema), validate(updateBookSchema), controller.update);
  router.delete("/:id", validateParams(bookIdParamSchema), controller.remove);

  return router;
}

export default createBooksRouter;
