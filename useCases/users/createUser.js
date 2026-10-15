import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Crear un usuario.
 * Regla de negocio: el email no puede estar duplicado.
 */
async function createUser(data, dao) {
  const existing = await dao.getByEmail(data.email);
  if (existing) {
    throw new AppError("EMAIL_DUPLICATED", "Ese email ya está registrado", 409);
  }

  return dao.save(data);
}

export default createUser;
