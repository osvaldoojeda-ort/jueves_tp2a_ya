import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import {
  createBookSchema,
  updateBookSchema,
  queryBooksSchema,
  queryBookByIdSchema,
  exportBooksQuerySchema,
  importBooksSchema,
  bookIdParamSchema,
} from "../schemas/bookSchema.js";

/**
 * Factory de Router para Libros.
 * Recibe el controlador ya instanciado (con los casos de uso inyectados) y los middlewares de auth.
 * Lectura pública; escritura, importación y exportación solo para administradores;
 * el detalle enriquecido (consulta a una API externa) exige estar autenticado.
 */
function createBooksRouter(controller, { authenticate, authorize }) {
  const router = express.Router();

  router.get("/", validateQuery(queryBooksSchema), controller.list);
  // Reflexión: si "/export.csv" se declarara DESPUÉS de "/:id", Express evalúa las rutas en orden de declaración y
  // "/:id" captura cualquier texto, incluido "export.csv". La validación del id (número entero) fallaría con un
  // 400 confuso y la exportación nunca se ejecutaría. Las rutas específicas van antes que las que tienen parámetros.
  // OJO con el orden: "/export.csv" tiene que declararse ANTES de "/:id", si no Express lo toma como un id
  router.get("/export.csv", authenticate, authorize("admin"), validateQuery(exportBooksQuerySchema), controller.exportCsv);
  router.post("/import", authenticate, authorize("admin"), validate(importBooksSchema), controller.import);
  router.get("/:id/details", authenticate, validateParams(bookIdParamSchema), controller.details);
  router.get("/:id", validateParams(bookIdParamSchema), validateQuery(queryBookByIdSchema), controller.get);
  router.post("/", authenticate, authorize("admin"), validate(createBookSchema), controller.create);
  router.put("/:id", authenticate, authorize("admin"), validateParams(bookIdParamSchema), validate(updateBookSchema), controller.update);
  router.delete("/:id", authenticate, authorize("admin"), validateParams(bookIdParamSchema), controller.remove);

  return router;
}

export default createBooksRouter;
