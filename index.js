import express from "express";
import dao from "./dao/booksMemoryDao.js";
import makeBookUseCases from "./usecases/books/makeBookUsesCases.js";
import BooksController from "./controllers/booksController.js";
import createRouter from "./routes/index.js";

const bookUseCases = makeBookUseCases(dao);
const booksController = new BooksController(bookUseCases);

const app = express();
app.use(express.json());
app.use(createRouter(booksController));

app.listen(8000, () => {
  console.log("Servidor escuchando en http://localhost:8000");
});
