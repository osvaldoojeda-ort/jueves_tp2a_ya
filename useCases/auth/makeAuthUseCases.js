import AppError from "../../errors/AppError.js";
import registerUser from "./registerUser.js";
import loginUser from "./loginUser.js";
import changePassword from "./changePassword.js"; // ← NUEVO (Ej. 10.3)

/**
 * Agrupa los casos de uso de autenticación con sus dependencias inyectadas.
 * Se arma una sola vez en el container.
 */
function makeAuthUseCases({ dao, events, hasher, tokens }) {
  // ← NUEVO (Ej. 10.1): hash falso para el login con email inexistente.
  // Se genera UNA sola vez con el mismo hasher (mismo costo que los reales).
  // Se guarda la promesa sin await: así la factory sigue siendo síncrona.
  const dummyHash = hasher.hash("hash-falso-para-igualar-tiempos");

  return {
    register: (data) => registerUser(data, dao, events, hasher),

    login: (data) => loginUser(data, dao, hasher, tokens, dummyHash), // ← CAMBIÓ

    // ← NUEVO (Ej. 10.3)
    changePassword: (actor, data) => changePassword(actor, data, dao, hasher),

    // actor = req.user ({ id, rol }) que deja el middleware authenticate
    getProfile: async (actor) => {
      const user = await dao.getById(actor.id);
      if (!user) {
        throw new AppError("USER_NOT_FOUND", "Usuario no encontrado", 404);
      }
      return user;
    },
  };
}

export default makeAuthUseCases;