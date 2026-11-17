// security/passwordHasher.js — Ejercicio 2
// Único archivo del proyecto que conoce bcryptjs.
import bcrypt from "bcryptjs";

export function createPasswordHasher({ rounds }) {
  return {
    hash(plain) {
      return bcrypt.hash(plain, rounds);
    },
    compare(plain, hash) {
      return bcrypt.compare(plain, hash);
    },
  };
}