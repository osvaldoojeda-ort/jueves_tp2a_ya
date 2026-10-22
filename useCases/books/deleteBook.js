import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Eliminar un libro.
 * Regla de negocio: no se puede eliminar un libro que tenga préstamos (activos o históricos).
 * Devuelve `true` si fue eliminado o `false` si no existía.
 */
async function deleteBook(id, dao, loansDao) {
  const loans = await loansDao.getAll({ bookId: Number(id) });
  if (loans.length > 0) {
    throw new AppError("BOOK_HAS_LOANS", "No se puede eliminar un libro con préstamos asociados", 409);
  }

  return dao.delete(id);
}

export default deleteBook;
