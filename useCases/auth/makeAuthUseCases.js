import AppError from "../../errors/AppError.js";
import registerUser from "./registerUser.js";
import loginUser from "./loginUser.js";

/**
 * Agrupa los casos de uso de autenticación con sus dependencias inyectadas.
 * Se arma una sola vez en el container.
 */
function makeAuthUseCases({ dao, events, hasher, tokens }) {
  return {
    register: (data) => registerUser(data, dao, events, hasher),

    login: (data) => loginUser(data, dao, hasher, tokens),

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