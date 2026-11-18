import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Cambiar la propia contraseña (Ej. 10.3).
 * Regla de negocio: hay que demostrar que se conoce la contraseña actual.
 * Así, si alguien encuentra una sesión abierta o roba un token, no puede cambiarla
 * y dejar afuera al dueño de la cuenta.
 */
async function changePassword(actor, { currentPassword, newPassword }, dao, hasher) {
  // actor = req.user ({ id, rol }). El id sale del token, nunca del body.
  const user = await dao.getById(actor.id);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "El usuario del token ya no existe", 404);
  }

  // El hash solo se lee por getCredentialsByEmail: el resto del DAO no lo devuelve
  const credentials = await dao.getCredentialsByEmail(user.email);
  const ok = await hasher.compare(currentPassword, credentials.passwordHash);
  if (!ok) {
    throw new AppError("INVALID_CREDENTIALS", "La contraseña actual es incorrecta", 401);
  }

  // Se guarda el hash de la nueva, nunca el texto plano
  await dao.update(actor.id, { passwordHash: await hasher.hash(newPassword) });
}

export default changePassword;