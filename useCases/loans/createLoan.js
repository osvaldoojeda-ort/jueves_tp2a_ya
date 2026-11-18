import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";
import { assertOwnerOrAdmin } from "./loanPolicy.js"; // ← NUEVO

/**
 * Caso de Uso: Prestar un libro a un usuario.
 * Reglas de negocio:
 *  - userId es opcional: por defecto, el préstamo es para el actor.
 *  - Un lector solo puede pedir préstamos para sí mismo (403 si manda otro userId).
 *  - El usuario y el libro deben existir.
 *  - El usuario no puede tener ya ese libro sin devolver.
 *  - Debe haber stock disponible (el descuento y el préstamo se registran juntos en el DAO).
 * Efecto secundario desacoplado: si el stock queda bajo, emite "book.lowStock".
 */
async function createLoan(data, actor, loansDao, booksDao, usersDao, events) { // ← CAMBIÓ
  const userId = data.userId ?? actor.id; // ← NUEVO: por defecto, el del actor
  const { bookId } = data;

  assertOwnerOrAdmin(actor, userId); // ← NUEVO: 403 antes de cualquier otra cosa

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

/*
 * Ej. 8.4 — ¿Por qué esta regla va en el caso de uso y no en el router con authorize?
 * Va en el caso de uso porque authorize solo conoce el rol del usuario, pero para saber
 * si un préstamo es suyo hay que comparar loan.userId (dueño del préstamo) con actor.id
 * (quien hace el pedido), y ese dato está en la base, a la que el router no tiene acceso.
 * Además, es una regla de negocio, y en la arquitectura en capas esas reglas van en los
 * casos de uso. Así se cumple aunque el caso de uso se llame desde otro lugar
 * (otra ruta, un script o un test).
 */

export default createLoan;
