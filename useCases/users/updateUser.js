import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Actualizar un usuario.
 * Regla de negocio: si cambia el email, no puede pertenecer a otro usuario.
 * Seguridad: si viene una contraseña nueva, se guarda su hash, nunca el texto plano.
 */
async function updateUser(id, changes, dao, hasher) { // ← NUEVO: hasher
  if (changes.email) {
    const existing = await dao.getByEmail(changes.email);
    if (existing && existing.id !== Number(id)) {
      throw new AppError("EMAIL_DUPLICATED", "Ese email ya está registrado", 409);
    }
  }

  // ← NUEVO: la contraseña es opcional; solo se hashea si vino
  const { password, ...otherChanges } = changes;
  if (password !== undefined) {
    otherChanges.passwordHash = await hasher.hash(password);
  }

  return dao.update(id, otherChanges); // ← CAMBIÓ
}

export default updateUser;
