import { assertOwnerOrAdmin } from "./loanPolicy.js";

/**
 * Caso de Uso: Obtener un préstamo por ID.
 * Devuelve el préstamo o `null` si no existe (el 404 lo decide el controlador).
 * Autorización: si el préstamo no es del lector, 403.
 */
async function getLoanById(id, actor, dao) {
  const loan = await dao.getById(id);
  if (!loan) return null;

  assertOwnerOrAdmin(actor, loan.userId);
  return loan;
}

export default getLoanById;
