import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Actualizar un usuario.
 * Regla de negocio: si cambia el email, no puede pertenecer a otro usuario.
 */
async function updateUser(id, changes, dao) {
  if (changes.email) {
    const existing = await dao.getByEmail(changes.email);
    if (existing && existing.id !== Number(id)) {
      throw new AppError("EMAIL_DUPLICATED", "Ese email ya está registrado", 409);
    }
  }

  return dao.update(id, changes);
}

export default updateUser;
