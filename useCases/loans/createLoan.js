import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Prestar un libro a un usuario.
 * Reglas de negocio:
 *  - Un lector solo puede pedir libros para sí mismo; el administrador puede indicar `userId` (si no, es para él).
 *  - El usuario y el libro deben existir.
 *  - El usuario no puede tener ya ese libro sin devolver.
 *  - Debe haber stock disponible (el descuento y el préstamo se registran juntos en el DAO).
 * Efecto secundario desacoplado: si el stock queda bajo, emite "book.lowStock".
 */
// Reflexión: ¿por qué esta regla va acá y no en el router con authorize()?
// authorize("admin") solo mira el ROL, que se conoce antes de ejecutar nada. Esta regla depende de los DATOS
// del pedido (el userId que llega comparado con el id del actor), y es una regla de negocio: tiene que valer
// aunque mañana el caso de uso se invoque desde otro lado (un script, un evento, un test) sin pasar por Express.
async function createLoan(data, actor, loansDao, booksDao, usersDao, events) {
  const { bookId } = data;
  const userId = data.userId ?? actor.id;
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

export default createLoan;
