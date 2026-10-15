/**
 * Caso de Uso: Eliminar un usuario.
 * Devuelve `true` si fue eliminado o `false` si no existía.
 */
async function deleteUser(id, dao) {
  return dao.delete(id);
}

export default deleteUser;
