import express from "express";
import { rateLimit } from "express-rate-limit"; // ← NUEVO (Ej. 10.2)
import AppError from "../errors/AppError.js";
import validate from "../middlewares/validate.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../schemas/authSchema.js";
import { LOGIN_RATE_LIMIT_MAX } from "../config/config.js";

/**
 * Factory de Router para Autenticación.
 * Recibe el controlador y los middlewares de auth ya construidos.
 * /register y /login son públicos; /me y /password exigen token.
 */
function createAuthRouter(controller, auth) {
  const router = express.Router();

  // ← NUEVO (Ej. 10.2): freno a la fuerza bruta en el login.
  // Máximo LOGIN_RATE_LIMIT_MAX intentos FALLIDOS por IP por minuto (los exitosos no cuentan).
  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: LOGIN_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true, // un login OK (status < 400) no suma
    standardHeaders: "draft-7",   // manda el header RateLimit con lo que queda
    legacyHeaders: false,         // sin los viejos X-RateLimit-*
    // Mismo formato de error que el resto de la API: lo responde el errorHandler
    handler: (req, res, next) =>
      next(new AppError("TOO_MANY_ATTEMPTS", "Demasiados intentos fallidos, probá de nuevo en un minuto", 429)),
  });

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", loginLimiter, validate(loginSchema), controller.login); // ← CAMBIÓ
  router.get("/me", auth.authenticate, controller.me);
  router.put("/password", auth.authenticate, validate(changePasswordSchema), controller.changePassword); // ← NUEVO

  return router;
}

export default createAuthRouter;