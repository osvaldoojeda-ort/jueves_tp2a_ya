/*
 * PREGUNTA: ¿Por qué leer el umbral desde config dentro del caso de uso es aceptable,
 * pero instanciar el notificador ahí no lo es?
 *
 * RESPUESTA:
 * - El umbral es parte de la REGLA DE NEGOCIO ("cuándo el stock se considera bajo"). Es solo un valor,
 *   sin comportamiento, y decidir si hay que emitir el evento le corresponde al caso de uso.
 * - El notificador es el EFECTO SECUNDARIO ("cómo y por dónde avisar"): una implementación concreta
 *   (consola, archivo, mail). Si el caso de uso lo instanciara, quedaría acoplado a ese canal y habría
 *   que tocar la regla de negocio para cambiarlo. Eso viola la inversión de dependencias: por eso el caso
 *   de uso solo emite el evento, y el container decide quién escucha.
 */
import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";

/**
 * Caso de Uso: Actualizar un libro existente.
 * Reglas de negocio:
 *  - El stock no puede ser menor a 0 si se envía.
 *  - Si se envía userId, el usuario debe existir.
 * Efecto secundario desacoplado: si el cambio deja el stock bajo, emite "book.lowStock".
 */
async function updateBook(id, changes, dao, usersDao, events) {
  if (changes.stock !== undefined && changes.stock < 0) {
    throw new AppError("INVALID_STOCK", "El stock no puede ser negativo", 400);
  }

  if (changes.userId != null) {
    const user = await usersDao.getById(changes.userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
    }
  }

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