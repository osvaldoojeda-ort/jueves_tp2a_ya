import books from "../data/books.js";
import AppError from "../errors/AppError.js";

/**
 * Controller de libros (Ej. 3).
 * Ya no arma respuestas de error: las deriva con next(new AppError(...)) al errorHandler.
 * Tampoco valida el body: cuando llega acá, Zod ya lo validó en la ruta.
 */

const bookNotFound = (id) => new AppError("BOOK_NOT_FOUND", `No book exists with id ${id}`, 404);

// GET /books: filtro (?author=), orden (?sort=) y paginado (?page=&limit=)
function list(req, res, next) {
  const { author, sort } = req.query;
  let result = [...books];

  if (author) {
    const term = author.toLowerCase();
    result = result.filter((b) => b.author.toLowerCase().includes(term));
  }

  if (sort) {
    const desc = sort.startsWith("-");
    const field = desc ? sort.slice(1) : sort;
    result.sort((a, b) => {
      if (a[field] < b[field]) return desc ? 1 : -1;
      if (a[field] > b[field]) return desc ? -1 : 1;
      return 0;
    });
  }

  // Ya validados y convertidos a número por validateQuery(paginationSchema)
  const { page, limit } = req.pagination;
  const from = (page - 1) * limit;
  result = result.slice(from, from + limit);

  res.status(200).json(result);
}

// GET /books/:id
function get(req, res, next) {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return next(bookNotFound(req.params.id));

  res.status(200).json(book);
}

// POST /books (body validado por createBookSchema)
function create(req, res, next) {
  const { title, author, isbn, stock } = req.body;

  // Desafío: ISBN repetido. Es lógica de negocio (necesita los datos), no validación de formato.
  if (isbn && books.some((b) => b.isbn === isbn)) {
    return next(new AppError("ISBN_DUPLICATE", `A book with ISBN ${isbn} already exists`, 409));
  }

  const ids = books.map((b) => b.id);
  const newBook = {
    id: ids.length > 0 ? Math.max(...ids) + 1 : 1,
    isbn: isbn ?? "No ISBN",
    title,
    author,
    stock, // si no vino, Zod ya puso 0
  };

  books.push(newBook);
  res.status(201).json(newBook);
}

// PUT /books/:id (body validado por updateBookSchema: todo opcional)
function update(req, res, next) {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return next(bookNotFound(req.params.id));

  books[index] = { ...books[index], ...req.body, id }; // el id nunca se pisa
  res.status(200).json(books[index]);
}

// DELETE /books/:id
function remove(req, res, next) {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) return next(bookNotFound(req.params.id));

  books.splice(index, 1);
  res.status(200).json({ message: "Book deleted successfully" });
}

export default { list, get, create, update, remove };
