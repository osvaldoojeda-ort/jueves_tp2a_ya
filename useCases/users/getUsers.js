/**
 * Caso de Uso: Obtener todos los usuarios.
 */
async function getUsers(dao) {
  return dao.getAll();
}

export default getUsers;
