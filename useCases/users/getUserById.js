/**
 * Caso de Uso: Obtener un usuario por ID.
 * Devuelve el usuario o `null` si no existe (el 404 lo decide el controlador).
 * Con `incluir: "libros"` agrega los libros que tiene (filtrables con `activos`).
 */
async function getUserById(id, dao, loansDao, { incluir, activos } = {}) {
  const user = await dao.getById(id);
  if (!user || incluir !== "libros") return user;

  const loans = await loansDao.getAll({ userId: user.id, activos });
  return {
    ...user,
    libros: loans.map((l) => ({ ...l.libro, fechaPrestamo: l.fechaPrestamo, fechaDevolucion: l.fechaDevolucion })),
  };
}

export default getUserById;
