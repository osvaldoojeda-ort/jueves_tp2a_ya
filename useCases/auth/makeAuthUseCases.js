import registerUser from "./registerUser.js";
import loginUser from "./loginUser.js";
import changePassword from "./changePassword.js";
import { randomBytes } from "node:crypto";
import getUserById from "../users/getUserById.js";

/**
 * Factory de Casos de Uso de autenticación.
 * Recibe el DAO de usuarios, el de préstamos (para "mis libros"), el bus de eventos,
 * el hasheador de contraseñas y el servicio de tokens.
 */
function makeAuthUseCases({ usersDao, loansDao, events, hasher, tokens }) {
  // Hash falso con el mismo costo que los reales, para que el login tarde igual cuando el email no existe
  const dummyHash = hasher.hash(randomBytes(16).toString("hex"));

  return {
    register: (data) => registerUser(data, usersDao, events, hasher),
    login: (credentials) => loginUser(credentials, usersDao, hasher, tokens, dummyHash),
    changePassword: (userId, data) => changePassword(userId, data, usersDao, hasher),
    // Perfil del usuario autenticado (con ?incluir=libros trae sus libros)
    getProfile: (id, options) => getUserById(id, usersDao, loansDao, options),
  };
}

export default makeAuthUseCases;
