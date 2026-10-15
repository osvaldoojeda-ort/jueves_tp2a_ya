/**
 * Caso de Uso: Obtener un usuario por ID.
 * Devuelve el usuario o `null` si no existe (el 404 lo decide el controlador).
 */
async function getUserById(id, dao) {
  return dao.getById(id);
}

export default getUserById;
