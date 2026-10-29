import express from "express";
import { rateLimit } from "express-rate-limit";
import AppError from "../errors/AppError.js";
import validate, { validateQuery } from "../middlewares/validate.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../schemas/authSchema.js";
import { queryUserByIdSchema } from "../schemas/userSchema.js";
import { LOGIN_RATE_LIMIT_MAX } from "../config/config.js";

/**
 * Factory de Router para autenticación.
 * /register y /login son públicos; /me y /password exigen token.
 */
function createAuthRouter(controller, { authenticate }) {
  const router = express.Router();

  // Freno a la fuerza bruta: solo cuentan los intentos FALLIDOS (los exitosos no), por IP y por minuto.
  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: LOGIN_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Mismo formato de error que el resto de la API (lo resuelve el errorHandler)
    handler: (req, res, next) =>
      next(new AppError("TOO_MANY_ATTEMPTS", "Demasiados intentos fallidos, probá de nuevo en un minuto", 429)),
  });

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", loginLimiter, validate(loginSchema), controller.login);
  router.put("/password", authenticate, validate(changePasswordSchema), controller.changePassword);
  router.get("/me", authenticate, validateQuery(queryUserByIdSchema), controller.me);

  return router;
}

export default createAuthRouter;
