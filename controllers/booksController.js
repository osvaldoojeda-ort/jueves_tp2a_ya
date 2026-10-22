import AppError from "../errors/AppError.js";

/**
 * Controlador de Libros basado en Clases.
 * Recibe el objeto con los casos de uso (preconectados con el DAO por la Factory) a través de Inyección de Dependencias.
 * No importa ni conoce ningún DAO concreto.
 */
class BooksController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // GET /books (?autor=&isbn=&sort=&page=&limit=&incluir=usuarios&activos=)
  list = async (req, res) => {
    const books = await this.#useCases.getBooks(req.query);
    res.json(books);
  };

  // GET /books/:id
  get = async (req, res) => {
    const book = await this.#useCases.getBookById(Number(req.params.id), req.query);
    if (!book) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
    res.json(book);
  };

  // POST /books
  create = async (req, res) => {
    const book = await this.#useCases.createBook(req.body);
    res.status(201).json(book);
  };

  // PUT /books/:id
  update = async (req, res) => {
    const book = await this.#useCases.updateBook(Number(req.params.id), req.body);
    if (!book) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
    res.json(book);
  };

  // DELETE /books/:id
  remove = async (req, res) => {
    const deleted = await this.#useCases.deleteBook(Number(req.params.id));
    if (!deleted) throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
    res.status(204).send();
  };
}

// Exportamos la clase para permitir que el Composition Root (index.js) la instancie con los casos de uso inyectados
export default BooksController;
