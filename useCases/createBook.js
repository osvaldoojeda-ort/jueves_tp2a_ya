// usecases/createBook.js
import AppError from "../errors/AppError.js";

// data = { titulo, autor, isbn, stock } (ya validado por Zod)
async function createBook(data, dao) {
  const { isbn } = data;

  // Regla de negocio: no puede haber dos libros con el mismo ISBN
  if (isbn !== null && isbn !== undefined && isbn !== "") {
    const existing = await dao.getByIsbn(isbn);
    if (existing) {
      throw new AppError("ISBN_DUPLICATE", "Ese ISBN ya está registrado", 409);
    }
  }

  return dao.save(data);
}

export default createBook;
