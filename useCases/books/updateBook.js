import AppError from "../../errors/AppError.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Actualizar un libro existente.
 * Regla de negocio opcional: El stock no puede ser menor a 0 si se envía.
 * Efecto secundario desacoplado: si el cambio deja el stock bajo, emite "book.lowStock".
 * No sabe quién escucha ni qué se hace con el aviso (mail, log, etc.).
 *
 * Reflexión: ¿por qué leer LOW_STOCK_THRESHOLD desde config es aceptable acá, pero instanciar el notificador no?
 * - El umbral es una REGLA DE NEGOCIO ("cuándo el stock se considera bajo"): decide si hay que emitir el evento,
 *   y esa decisión le corresponde al caso de uso. Es solo un valor de configuración, sin comportamiento.
 * - El notificador es el EFECTO SECUNDARIO ("cómo y por dónde avisar"): es una implementación concreta
 *   (consola, archivo, mail) que el caso de uso no debe conocer. Si lo instanciara acá, volvería a quedar
 *   acoplado al canal y habría que tocar la regla para cambiarlo. Por eso solo emite el evento, y el
 *   contenedor decide quién escucha.
 */
async function updateBook(id, changes, dao, events) {
  if (changes.stock !== undefined && changes.stock < 0) {
    throw new AppError("INVALID_STOCK", "El stock no puede ser negativo", 400);
  }

  const updated = await dao.update(id, changes);

  // Solo si el cambio incluyó stock: evita avisar de nuevo al editar, por ejemplo, el título
  if (updated && changes.stock !== undefined && updated.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, { id: updated.id, titulo: updated.titulo, stock: updated.stock });
  }

  return updated;
}

export default updateBook;
