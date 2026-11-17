// security/tokenService.js — Ejercicio 4
// Único archivo del proyecto que conoce jsonwebtoken.
import jwt from "jsonwebtoken";
import AppError from "../errors/AppError.js"; // ← sin llaves; ajustá la ruta si tu carpeta se llama distinto

export function createTokenService({ secret, expiresIn }) {
  return {
    sign(payload) {
      return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn });
    },

    verify(token) {
      try {
        return jwt.verify(token, secret, { algorithms: ["HS256"] });
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          throw new AppError("TOKEN_EXPIRED", "El token expiró", 401);
        }
        throw new AppError("TOKEN_INVALID", "Token inválido", 401);
      }
    },
  };
}

/*
 * Ej. 4.3 — Pegando un token en jwt.io:
 * ¿Qué puedo ver sin conocer el secreto?
 * Todo el header ({ alg, typ }) y todo el payload ({ sub, rol, iat, exp }), porque solo
 * están codificados en Base64URL, no cifrados. La firma también se ve (es la 3ra parte).
 * Por eso nunca hay que poner datos sensibles en el payload (contraseña, passwordHash, etc.).
 * ¿Qué no podría hacer?
 * Verificar que la firma sea auténtica, ni generar una firma válida si modifico el payload.
 * Si cambio rol: "lector" por "admin", la firma deja de coincidir y la API responde
 * TOKEN_INVALID. El JWT garantiza integridad (que nadie lo alteró), no confidencialidad.
 */
