import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Cambiar la propia contraseña.
 * Regla de negocio: hay que demostrar que se conoce la contraseña actual. Así, quien encuentre una sesión
 * abierta (o robe un token) no puede cambiarla y dejar afuera al dueño.
 */
async function changePassword(userId, { currentPassword, newPassword }, dao, hasher) {
  const user = await dao.getById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "El usuario del token ya no existe", 404);
  }

  const credentials = await dao.getCredentialsByEmail(user.email);
  if (!(await hasher.compare(currentPassword, credentials.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", "La contraseña actual es incorrecta", 401);
  }

  await dao.update(userId, { passwordHash: await hasher.hash(newPassword) });
}

export default changePassword;
