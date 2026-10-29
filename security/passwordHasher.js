import bcrypt from "bcryptjs";

/**
 * Hasheador de contraseñas. Es el "contrato" que usan los casos de uso: hash() y compare().
 * Hoy se implementa con bcryptjs, pero los casos de uso no lo saben (igual que el DAO o el notificador).
 * bcrypt genera un salt aleatorio por cada hash y lo guarda dentro del propio resultado,
 * por eso dos usuarios con la misma contraseña terminan con hashes distintos.
 */
function createPasswordHasher({ rounds }) {
  return {
    hash: (plain) => bcrypt.hash(plain, rounds),
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  };
}

export default createPasswordHasher;
