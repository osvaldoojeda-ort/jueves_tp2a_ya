// scripts/authDemo.js — Ejecutar con: node scripts/authDemo.js
import { EventEmitter } from "node:events";
import { UsersMemoryDao } from "../dao/users/UsersMemoryDao.js"; // ← ajustá la ruta a la tuya
import { createPasswordHasher } from "../security/passwordHasher.js";
import { createTokenService } from "../security/tokenService.js";
import makeAuthUseCases from "../usecases/auth/makeAuthUseCases.js";
import seedAdmin from "../usecases/auth/seedAdmin.js";

const dao = new UsersMemoryDao();
const events = new EventEmitter();
const hasher = createPasswordHasher({ rounds: 4 }); // rounds bajo para que el demo sea rápido
const tokens = createTokenService({ secret: "secreto-de-prueba", expiresIn: "1h" });
const auth = makeAuthUseCases({ dao, events, hasher, tokens });

// Muestra el código de error o el resultado
const probar = async (titulo, fn) => {
  try {
    console.log(`✔ ${titulo}:`, await fn());
  } catch (err) {
    console.log(`✘ ${titulo}: ${err.statusCode} ${err.code}`);
  }
};

await probar("seedAdmin", () => seedAdmin({ email: "admin@biblioteca.com", password: "Admin12345" }, dao, events, hasher));
await probar("seedAdmin 2da vez (idempotente)", () => seedAdmin({ email: "admin@biblioteca.com", password: "Admin12345" }, dao, events, hasher));
await probar("register (intenta ser admin)", () => auth.register({ nombre: "Ana", email: "ana@mail.com", password: "clave1234", rol: "admin" }));
await probar("register email repetido", () => auth.register({ nombre: "Ana", email: "ana@mail.com", password: "clave1234" }));
await probar("login OK", () => auth.login({ email: "ana@mail.com", password: "clave1234" }));
await probar("login clave incorrecta", () => auth.login({ email: "ana@mail.com", password: "otra" }));
await probar("login email inexistente", () => auth.login({ email: "nadie@mail.com", password: "clave1234" }));
await probar("getProfile id 2", () => auth.getProfile({ id: 2, rol: "lector" }));
await probar("getProfile id 99", () => auth.getProfile({ id: 99, rol: "lector" }));