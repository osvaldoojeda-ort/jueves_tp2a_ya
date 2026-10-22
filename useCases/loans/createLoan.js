import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Prestar un libro a un usuario.
 * Reglas de negocio:
 *  - El usuario y el libro deben existir.
 *  - El usuario no puede tener ya ese libro sin devolver.
 *  - Debe haber stock disponible (el descuento y el préstamo se registran juntos en el DAO).
 * Efecto secundario desacoplado: si el stock queda bajo, emite "book.lowStock".
 */
async function createLoan({ userId, bookId }, loansDao, booksDao, usersDao, events) {
  const user = await usersDao.getById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
  }

  const book = await booksDao.getById(bookId);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
  }

  const active = await loansDao.getActive(userId, bookId);
  if (active) {
    throw new AppError("ALREADY_LOANED", "El usuario ya tiene ese libro sin devolver", 409);
  }

  const loan = await loansDao.lend({ userId, bookId });
  if (!loan) {
    throw new AppError("OUT_OF_STOCK", "No hay stock disponible de ese libro", 409);
  }

  const updatedBook = await booksDao.getById(bookId);
  if (updatedBook.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, { id: updatedBook.id, titulo: updatedBook.titulo, stock: updatedBook.stock });
  }

  return loan;
}

export default createLoan;
