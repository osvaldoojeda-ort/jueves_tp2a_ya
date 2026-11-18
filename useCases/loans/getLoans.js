import { isAdmin, assertOwnerOrAdmin } from "./loanPolicy.js";

/**
 * Caso de Uso: Listar préstamos con filtros opcionales (userId, bookId, activos).
 * Autorización: un lector siempre ve solo los suyos; si pide el userId de otro, 403.
 */
async function getLoans(filters = {}, actor, dao) {
  if (isAdmin(actor)) {
    return dao.getAll(filters);
  }

  if (filters.userId !== undefined) {
    assertOwnerOrAdmin(actor, filters.userId); // pidió el de otro -> 403
  }

  // Se fuerza su propio userId, lo haya mandado o no
  return dao.getAll({ ...filters, userId: actor.id });
}

export default getLoans;