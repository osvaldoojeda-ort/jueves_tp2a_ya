// usecases/updateBook.js
import AppError from "../errors/AppError.js";

async function updateBook(id, changes, dao) {
  // DESAFÍO OPCIONAL: regla de stock mínimo
  if (changes.stock !== undefined && changes.stock < 0) {
    throw new AppError("INVALID_STOCK", "El stock no puede ser negativo", 400);
  }

  return dao.update(id, changes); // libro actualizado o null
}

export default updateBook;
