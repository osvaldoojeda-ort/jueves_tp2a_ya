/*
 * PREGUNTA: ¿Por qué leer el umbral desde config dentro del caso de uso es aceptable,
 * pero instanciar el notificador ahí no lo es?
 *
 * RESPUESTA: (porque instanciar dependencias dentro de los casos de uso viola el principio de inversión de dependencias)
 */
import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";

async function updateBook(id, changes, dao, usersDao, events) {
  // ... tus dos validaciones de siempre (stock negativo y userId) quedan IGUAL ...

  const updated = await dao.update(id, changes);

  // Caso: el libro no existe → no emitimos nada (el controller devuelve 404)
  if (!updated) return null;

  // Solo alertamos si en ESTE cambio vino el stock
  const stockChanged = changes.stock !== undefined;

  if (stockChanged && updated.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, {
      id: updated.id,
      titulo: updated.titulo,
      stock: updated.stock,
    });
  }

  return updated;
}

export default updateBook;