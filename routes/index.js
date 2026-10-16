import { Router } from "express";
import createBooksRouter from "./booksRoutes.js";

function createRouter(booksController) {
  const router = Router();
  router.use("/books", createBooksRouter(booksController));
  return router;
}

export default createRouter;

