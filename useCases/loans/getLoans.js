import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Listar préstamos con filtros opcionales (userId, bookId, activos).
 * Regla de acceso: un lector solo ve sus propios préstamos; el administrador ve todos.
 */
async function getLoans(filters = {}, actor, dao) {
  if (actor.rol !== "admin") {
    if (filters.userId !== undefined && filters.userId !== actor.id) {
      throw new AppError("FORBIDDEN", "No tenés permiso para ver préstamos de otros usuarios", 403);
    }
    return dao.getAll({ ...filters, userId: actor.id });
  }
  return dao.getAll(filters);
}

export default getLoans;
