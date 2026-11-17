import getUsers from "./getUsers.js";
import getUserById from "./getUserById.js";
import createUser from "./createUser.js";
import updateUser from "./updateUser.js";
import deleteUser from "./deleteUser.js";

/**
 * Factory de Casos de Uso para Usuarios.
 * Recibe el DAO de usuarios, el de préstamos (para validar el borrado), el bus de eventos
 * y el hasher de contraseñas, e inyecta las dependencias en cada caso de uso.
 */
function makeUserUseCases(dao, loansDao, events, hasher) { // ← CAMBIÓ: recibe hasher
  return {
    getUsers: (filters) => getUsers(filters, dao, loansDao),
    getUserById: (id, options) => getUserById(id, dao, loansDao, options),
    createUser: (data) => createUser(data, dao, events, hasher),           // ← CAMBIÓ
    updateUser: (id, changes) => updateUser(id, changes, dao, hasher),     // ← CAMBIÓ
    deleteUser: (id) => deleteUser(id, dao, loansDao),
  };
}

export default makeUserUseCases;
