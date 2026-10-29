import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Actualizar un usuario.
 * Regla de negocio: si cambia el email, no puede pertenecer a otro usuario.
 * Si viene `password`, se vuelve a hashear antes de guardar.
 */
async function updateUser(id, changes, dao, hasher) {
  if (changes.email) {
    const existing = await dao.getByEmail(changes.email);
    if (existing && existing.id !== Number(id)) {
      throw new AppError("EMAIL_DUPLICATED", "Ese email ya está registrado", 409);
    }
  }

  const { password, ...rest } = changes;
  const data = password ? { ...rest, passwordHash: await hasher.hash(password) } : rest;

  return dao.update(id, data);
}

export default updateUser;
