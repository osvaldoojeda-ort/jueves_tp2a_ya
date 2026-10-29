/**
 * Caso de Uso: Sembrar el administrador inicial.
 * Se ejecuta al arrancar: si no existe un usuario con ADMIN_EMAIL, lo crea con ADMIN_PASSWORD hasheada.
 * Pasa por el DAO directamente (no emite "user.created": no es un alta de un usuario real).
 */
async function seedAdmin({ email, password }, dao, hasher) {
  if (!password) {
    console.warn("[Seed] ADMIN_PASSWORD no está definida: no se crea el administrador inicial");
    return;
  }
  if (await dao.getByEmail(email)) return;

  await dao.save({ nombre: "Admin", email, rol: "admin", passwordHash: await hasher.hash(password) });
  console.log(`[Seed] Administrador inicial creado (${email})`);
}

export default seedAdmin;
