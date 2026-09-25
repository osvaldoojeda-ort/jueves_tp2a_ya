import express from "express";
import booksController from "../controllers/booksController.js";
import validate, { validateQuery } from "../middlewares/validate.js";
import { createBookSchema, updateBookSchema, paginationSchema } from "../schemas/bookSchema.js";

const router = express.Router();

// router.get("/", validateQuery(paginationSchema), booksController.list);
// router.get("/:id", booksController.get);
// router.post("/", validate(createBookSchema), booksController.create);
// router.put("/:id", validate(updateBookSchema), booksController.update);
// router.delete("/:id", booksController.remove);
router.get("/",       booksController.list);
router.get("/:id",    booksController.get);
router.post("/",      validate(createBookSchema), booksController.create);
router.put("/:id",    validate(updateBookSchema),   booksController.update);
router.delete("/:id", booksController.remove);

export default router;
