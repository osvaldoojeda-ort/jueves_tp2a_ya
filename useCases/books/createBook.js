import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Crear un nuevo libro.
 * Aplica la regla de negocio: Si se proporciona ISBN, no debe estar duplicado.
 */
async function createBook(data, dao, events) {
  if (data.isbn) {
    const existingBook = await dao.getByIsbn(data.isbn);
    if (existingBook) {
      throw new AppError("ISBN_DUPLICATE", "Ese ISBN ya está registrado", 409);
    }
  }

  const created = await dao.save(data);

  // Un libro puede nacer con stock bajo
  if (created.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, { id: created.id, titulo: created.titulo, stock: created.stock });
  }

  return created;
}

export default createBook;
