import createUser from "../users/createUser.js";

/**
 * Caso de Uso: Autoregistro público.
 * Reusa createUser (email duplicado, hash, evento "user.created") pero fuerza el rol "lector":
 * nadie puede darse permisos de admin al registrarse.
 */
async function registerUser(data, dao, events, hasher) {
  return createUser({ ...data, rol: "lector" }, dao, events, hasher);
}

export default registerUser;
