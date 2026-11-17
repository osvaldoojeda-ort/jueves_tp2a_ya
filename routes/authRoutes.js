import express from "express";
import validate from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";

/**
 * Factory de Router para Autenticación.
 * Recibe el controlador y los middlewares de auth ya construidos.
 */
function createAuthRouter(controller, auth) {
  const router = express.Router();

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", validate(loginSchema), controller.login);
  router.get("/me", auth.authenticate, controller.me);

  return router;
}

export default createAuthRouter;