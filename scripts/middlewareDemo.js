// scripts/middlewareDemo.js — Ejecutar con: node scripts/middlewareDemo.js
import { createTokenService } from "../security/tokenService.js";
import createAuthMiddlewares from "../middlewares/auth.js";

const tokens = createTokenService({ secret: "secreto-de-prueba", expiresIn: "1h" });
const { authenticate, authorize } = createAuthMiddlewares(tokens);

const tokenLector = tokens.sign({ sub: "2", rol: "lector" });
const tokenAdmin = tokens.sign({ sub: "1", rol: "admin" });

// Ejecuta una cadena de middlewares como lo haría Express
function correr(titulo, headers, ...middlewares) {
  const req = { headers };
  let i = 0;
  const next = (err) => {
    if (err) return console.log(`✘ ${titulo}: ${err.statusCode} ${err.code}`);
    if (i < middlewares.length) return middlewares[i++](req, {}, next);
    console.log(`✔ ${titulo}: pasa, req.user =`, req.user);
  };
  next();
}

correr("sin header", {}, authenticate);
correr("sin Bearer", { authorization: tokenLector }, authenticate);
correr("token basura", { authorization: "Bearer abc.def.ghi" }, authenticate);
correr("lector autenticado", { authorization: `Bearer ${tokenLector}` }, authenticate);
correr("lector -> ruta admin", { authorization: `Bearer ${tokenLector}` }, authenticate, authorize("admin"));
correr("admin -> ruta admin", { authorization: `Bearer ${tokenAdmin}` }, authenticate, authorize("admin"));
correr("authorize sin authenticate", {}, authorize("admin"));