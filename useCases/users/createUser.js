import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";

/**
 * Caso de Uso: Crear un usuario.
 * Regla de negocio: el email no puede estar duplicado.
 * Efecto secundario desacoplado: al crear el usuario emite "user.created" (ej. mail de bienvenida).
 */
async function createUser(data, dao, events) {
  const existing = await dao.getByEmail(data.email);
  if (existing) {
    throw new AppError("EMAIL_DUPLICATED", "Ese email ya está registrado", 409);
  }

  const created = await dao.save(data);

  events.emit(EVENTS.USER_CREATED, { id: created.id, nombre: created.nombre, email: created.email });

  return created;
}

export default createUser;
