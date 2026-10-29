import jwt from "jsonwebtoken";
import AppError from "../errors/AppError.js";

/**
 * Servicio de tokens JWT. Contrato: sign(payload) y verify(token).
 * sign() firma el payload con el secreto y le pone fecha de expiración.
 *
 * ¿Qué se ve en jwt.io sin conocer el secreto? Todo el header y el payload (sub, rol, iat, exp): son solo base64.
 * ¿Qué no se puede hacer? Modificarlos y que el token siga siendo válido: la firma dejaría de coincidir.
 * Por eso en el payload no va nada sensible. La firma da integridad, no confidencialidad.
 *
 * verify() devuelve el payload si la firma es válida y no venció; si no, lanza un AppError 401.
 */
function createTokenService({ secret, expiresIn }) {
  return {
    sign: (payload) => jwt.sign(payload, secret, { expiresIn }),

    verify(token) {
      try {
        // Fijamos el algoritmo para que nadie pueda cambiarlo desde el header del token
        return jwt.verify(token, secret, { algorithms: ["HS256"] });
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          throw new AppError("TOKEN_EXPIRED", "El token venció, iniciá sesión de nuevo", 401);
        }
        throw new AppError("TOKEN_INVALID", "Token inválido", 401);
      }
    },
  };
}

export default createTokenService;
