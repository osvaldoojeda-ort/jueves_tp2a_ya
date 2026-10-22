/**
 * Caso de Uso: Obtener un préstamo por ID.
 * Devuelve el préstamo o `null` si no existe (el 404 lo decide el controlador).
 */
async function getLoanById(id, dao) {
  return dao.getById(id);
}

export default getLoanById;
