/**
 * Caso de Uso: Listar préstamos con filtros opcionales (userId, bookId, activos).
 */
async function getLoans(filters = {}, dao) {
  return dao.getAll(filters);
}

export default getLoans;
