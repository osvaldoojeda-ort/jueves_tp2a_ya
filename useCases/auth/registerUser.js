import createUser from "../users/createUser.js";

/**
 * Caso de Uso: Registro público.
 * Reutiliza createUser, pero el rol lo decide el sistema, no el cliente:
 * cualquiera que se registre solo puede ser lector.
 */
async function registerUser(data, dao, events, hasher) {
  return createUser({ ...data, rol: "lector" }, dao, events, hasher);
}

export default registerUser;