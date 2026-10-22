import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Eliminar un usuario.
 * Regla de negocio: no se puede eliminar un usuario que tenga préstamos (activos o históricos).
 * Devuelve `true` si fue eliminado o `false` si no existía.
 */
async function deleteUser(id, dao, loansDao) {
  const loans = await loansDao.getAll({ userId: Number(id) });
  if (loans.length > 0) {
    throw new AppError("USER_HAS_LOANS", "No se puede eliminar un usuario con préstamos asociados", 409);
  }

  return dao.delete(id);
}

export default deleteUser;
