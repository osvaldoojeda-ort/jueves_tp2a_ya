import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Prestar un libro a un usuario.
 * Reglas de negocio:
 *  - Un lector solo puede pedir préstamos a su nombre. El admin puede indicar cualquier userId.
 *  - Si no viene userId, el préstamo es para el actor (el usuario del token).
 *  - El usuario y el libro deben existir.
 *  - El usuario no puede tener ya ese libro sin devolver.
 *  - Debe haber stock disponible (el descuento y el préstamo se registran juntos en el DAO).
 * Efecto secundario desacoplado: si el stock queda bajo, emite "book.lowStock".
 */
async function createLoan(data, actor, loansDao, booksDao, usersDao, events) { // ← CAMBIÓ: actor
  // ← NUEVO (Ej. 8.1): actor = req.user ({ id, rol }) que deja authenticate
  const { bookId } = data;
  const userId = data.userId ?? actor.id; // por defecto, para uno mismo
  if (actor.rol !== "admin" && userId !== actor.id) {
    throw new AppError("FORBIDDEN", "Solo podés pedir préstamos a tu nombre", 403);
  }

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
 * authorize("admin") solo mira el ROL del token, y eso se sabe antes de ejecutar nada.
 * Esta regla depende de los DATOS: hay que comparar el userId del pedido (o el dueño del préstamo,
 * que está en la base) con el id del actor. El router no tiene esa información.
 * Además es una regla de negocio: tiene que cumplirse aunque el caso de uso se llame desde otro lado
 * (un script, un test, un evento) sin pasar por Express. Si estuviera en el router, ahí se saltearía.
 */

export default createLoan;