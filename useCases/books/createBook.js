import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";

/**
 * Caso de Uso: Crear un nuevo libro.
 * Reglas de negocio:
 *  - Si se proporciona ISBN, no debe estar duplicado.
 *  - Si se proporciona userId, el usuario debe existir.
 * Efecto secundario desacoplado: si el libro nace con stock bajo, emite "book.lowStock".
 */
async function createBook(data, dao, usersDao, events) {
  if (data.isbn) {
    const existingBook = await dao.getByIsbn(data.isbn);
    if (existingBook) {
      throw new AppError("ISBN_DUPLICATE", "Ese ISBN ya está registrado", 409);
    }
  }

  if (data.userId != null) {
    const user = await usersDao.getById(data.userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
    }
  }

  const created = await dao.save(data);

  // Un libro puede "nacer" con stock bajo
  if (created.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, {
      id: created.id,
      titulo: created.titulo,
      stock: created.stock,
    });
  }

  return created;
}

export default createBook;