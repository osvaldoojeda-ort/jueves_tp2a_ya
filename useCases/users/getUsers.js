/**
 * Caso de Uso: Listar usuarios con filtros y paginación (delegados al DAO).
 * Con `incluir: "libros"` cada usuario trae los libros que tiene (relación N a N vía préstamos).
 */
async function getUsers(filters = {}, dao, loansDao) {
  const { nombre, email, rol, page, limit, incluir, activos } = filters;

  const users = await dao.getAll({ nombre, email, rol, page, limit });
  if (incluir !== "libros" || users.length === 0) return users;

  // Una sola consulta de préstamos para todos los usuarios de la página
  const loans = await loansDao.getAll({ userId: users.map((u) => u.id), activos });
  return users.map((user) => ({
    ...user,
    libros: loans
      .filter((l) => l.userId === user.id)
      .map((l) => ({ ...l.libro, fechaPrestamo: l.fechaPrestamo, fechaDevolucion: l.fechaDevolucion })),
  }));
}

export default getUsers;
