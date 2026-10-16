import express from "express";
import validate from "../middlewares/validate.js";
import { createBookSchema, updateBookSchema } from "../schemas/bookSchema.js";

function createBooksRouter(controller) {
  const router = express.Router();

  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", validate(createBookSchema), controller.create);
  router.put("/:id", validate(updateBookSchema), controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

export default createBooksRouter;
