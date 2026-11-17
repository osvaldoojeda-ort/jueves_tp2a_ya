// scripts/tokenDemo.js — Ejercicio 4
// Ejecutar con: node scripts/tokenDemo.js
import { createTokenService } from "../security/tokenService.js";

const tokens = createTokenService({ secret: "secreto-de-prueba", expiresIn: "2s" });

// 1) Firmar y verificar
const token = tokens.sign({ sub: "1", rol: "lector" });
console.log("token:", token);
console.log("payload verificado:", tokens.verify(token));

// 2) Token modificado: se cambia el payload (rol admin) pero la firma queda vieja
const [header, , firma] = token.split(".");
const payloadFalso = Buffer.from(JSON.stringify({ sub: "1", rol: "admin" })).toString("base64url");
try {
  tokens.verify(`${header}.${payloadFalso}.${firma}`);
} catch (err) {
  console.log("modificado ->", err.statusCode, err.code);
}

// 3) Token vencido: esperamos 3 segundos (el token dura 2)
await new Promise((r) => setTimeout(r, 3000));
try {
  tokens.verify(token);
} catch (err) {
  console.log("vencido ->", err.statusCode, err.code);
}