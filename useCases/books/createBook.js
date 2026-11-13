import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Crear un nuevo libro.
 * Aplica la regla de negocio: Si se proporciona ISBN, no debe estar duplicado.
 *
 * Clase 14: el umbral de stock bajo llega INYECTADO (`lowStockThreshold`). Antes se importaba de config.js,
 * y config.js lanza un error si falta JWT_SECRET: el test de este caso de uso explotaba por una variable de
 * entorno que no tiene nada que ver con libros. Si cuesta testearlo, está acoplado.
 */
async function createBook(data, dao, events, lowStockThreshold) {
  if (data.isbn) {
    const existingBook = await dao.getByIsbn(data.isbn);
    if (existingBook) {
      throw new AppError("ISBN_DUPLICATE", "Ese ISBN ya está registrado", 409);
    }
  }

  const created = await dao.save(data);

  // Un libro puede nacer con stock bajo
  if (created.stock <= lowStockThreshold) {
    events.emit(EVENTS.BOOK_LOW_STOCK, { id: created.id, titulo: created.titulo, stock: created.stock });
  }

  return created;
}

export default createBook;
