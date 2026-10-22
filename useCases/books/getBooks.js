/**
 * Caso de Uso: Listar libros con filtros, orden y paginación.
 * Los filtros se delegan al DAO (en SQL son WHERE / ORDER BY / LIMIT); acá solo se normalizan los alias.
 * Con `incluir: "usuarios"` cada libro trae los usuarios que lo tienen (relación N a N vía préstamos).
 */
async function getBooks(filters = {}, dao, loansDao) {
  const { autor, author, isbn, sort, page, limit, incluir, activos } = filters;

  const books = await dao.getAll({ autor: autor ?? author, isbn, sort, page, limit });
  if (incluir !== "usuarios" || books.length === 0) return books;

  // Una sola consulta de préstamos para todos los libros de la página (no una por libro)
  const loans = await loansDao.getAll({ bookId: books.map((b) => b.id), activos });
  return books.map((book) => ({
    ...book,
    usuarios: loans
      .filter((l) => l.bookId === book.id)
      .map((l) => ({ ...l.usuario, fechaPrestamo: l.fechaPrestamo, fechaDevolucion: l.fechaDevolucion })),
  }));
}

export default getBooks;
