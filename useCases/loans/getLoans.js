import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Listar préstamos con filtros opcionales (userId, bookId, activos).
 * Regla de acceso (Ej. 8.2): un lector solo ve sus propios préstamos; el admin ve todos.
 */
async function getLoans(filters = {}, actor, dao) { // ← CAMBIÓ: actor
  if (actor.rol !== "admin") {
    // Pidió explícitamente los de otro usuario -> 403
    if (filters.userId !== undefined && filters.userId !== actor.id) {
      throw new AppError("FORBIDDEN", "No tenés permiso para ver préstamos de otros usuarios", 403);
    }
    // Si no mandó userId, se fuerza el suyo: nunca ve los de los demás
    return dao.getAll({ ...filters, userId: actor.id });
  }

  return dao.getAll(filters);
}

export default getLoans;