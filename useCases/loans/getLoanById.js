import AppError from "../../errors/AppError.js";
import { withStatus } from "../../domain/loanStatus.js";

/**
 * Caso de Uso: Obtener un préstamo por ID.
 * Devuelve el préstamo (con su estado calculado) o `null` si no existe (el 404 lo decide el controlador).
 * Regla de acceso: un lector solo puede ver sus propios préstamos.
 */
async function getLoanById(id, actor, { loansDao, clock }) {
  const loan = await loansDao.getById(id);
  if (loan && actor.rol !== "admin" && loan.userId !== actor.id) {
    throw new AppError("FORBIDDEN", "No tenés permiso para ver este préstamo", 403);
  }
  return withStatus(loan, clock.today());
}

export default getLoanById;
