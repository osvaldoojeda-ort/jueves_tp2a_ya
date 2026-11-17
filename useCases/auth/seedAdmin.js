import createUser from "../users/createUser.js";

/**
 * Caso de Uso: Sembrar el administrador inicial.
 * Idempotente: si ya existe un usuario con ese email, no hace nada.
 */
async function seedAdmin({ email, password }, dao, events, hasher) {
  if (!email || !password) {
    console.warn("[seedAdmin] ADMIN_EMAIL o ADMIN_PASSWORD no definidos: no se crea el admin.");
    return null;
  }

  const existing = await dao.getByEmail(email);
  if (existing) return existing;

  const admin = await createUser({ nombre: "Administrador", email, password, rol: "admin" }, dao, events, hasher);
  console.log(`[seedAdmin] Admin creado: ${admin.email}`);
  return admin;
}

export default seedAdmin;