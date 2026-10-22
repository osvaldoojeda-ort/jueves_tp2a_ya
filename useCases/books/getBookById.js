/**
 * Caso de Uso: Obtener un libro por ID.
 * Devuelve el libro o `null` si no existe (el 404 lo decide el controlador).
 * Con `incluir: "usuarios"` agrega los usuarios que lo tienen (filtrables con `activos`).
 */
async function getBookById(id, dao, loansDao, { incluir, activos } = {}) {
  const book = await dao.getById(id);
  if (!book || incluir !== "usuarios") return book;

  const loans = await loansDao.getAll({ bookId: book.id, activos });
  return {
    ...book,
    usuarios: loans.map((l) => ({ ...l.usuario, fechaPrestamo: l.fechaPrestamo, fechaDevolucion: l.fechaDevolucion })),
  };
}

export default getBookById;
