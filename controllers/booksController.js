// controllers/booksController.js
// Delegador HTTP puro: extrae datos de req, llama al caso de uso y arma la res.
// Sin lógica de negocio y sin try/catch (Express 5 manda los rechazos async al errorHandler).
import AppError from "../errors/AppError.js";
import dao from "../dao/booksMemoryDao.js";

import getBooks    from "../usecases/getBooks.js";
import getBookById from "../usecases/getBookById.js";
import createBook  from "../usecases/createBook.js";
import updateBook  from "../usecases/updateBook.js";
import deleteBook  from "../usecases/deleteBook.js";

async function list(req, res) {
  const books = await getBooks(dao);
  res.json(books);
}

async function get(req, res) {
  const book = await getBookById(Number(req.params.id), dao);
  if (!book) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
  res.json(book);
}

async function create(req, res) {
  const book = await createBook(req.body, dao);
  res.status(201).json(book);
}

async function update(req, res) {
  const book = await updateBook(Number(req.params.id), req.body, dao);
  if (!book) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
  res.json(book);
}

async function remove(req, res) {
  const ok = await deleteBook(Number(req.params.id), dao);
  if (!ok) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
  res.status(204).send();
}

export default { list, get, create, update, remove };
