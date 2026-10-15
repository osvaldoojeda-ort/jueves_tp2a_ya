import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Crear un nuevo libro.
 * Aplica la regla de negocio: Si se proporciona ISBN, no debe estar duplicado.
 */
async function createBook(data, dao, usersDao) {
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

  return dao.save(data);
}

export default createBook;
