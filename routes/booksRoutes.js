import { Router } from "express";
import booksController from "../controllers/booksController.js";
import validate, { validateQuery } from "../middlewares/validate.js";
import { createBookSchema, updateBookSchema, paginationSchema } from "../schemas/bookSchema.js";

const booksRoutes = Router();

// La validación va ANTES del controller: si falla, el controller ni se ejecuta
booksRoutes.get("/", validateQuery(paginationSchema), booksController.list);
booksRoutes.get("/:id", booksController.get);
booksRoutes.post("/", validate(createBookSchema), booksController.create);
booksRoutes.put("/:id", validate(updateBookSchema), booksController.update);
booksRoutes.delete("/:id", booksController.remove);

export default booksRoutes;
