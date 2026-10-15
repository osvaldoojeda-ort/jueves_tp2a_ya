import getUsers from "./getUsers.js";
import getUserById from "./getUserById.js";
import createUser from "./createUser.js";
import updateUser from "./updateUser.js";
import deleteUser from "./deleteUser.js";

/**
 * Factory de Casos de Uso para Usuarios.
 * Recibe el DAO e inyecta la dependencia en cada caso de uso.
 */
function makeUserUseCases(dao) {
  return {
    getUsers: () => getUsers(dao),
    getUserById: (id) => getUserById(id, dao),
    createUser: (data) => createUser(data, dao),
    updateUser: (id, changes) => updateUser(id, changes, dao),
    deleteUser: (id) => deleteUser(id, dao),
  };
}

export default makeUserUseCases;
