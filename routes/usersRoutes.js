import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  queryUsersSchema,
  queryUserByIdSchema,
  userIdParamSchema,
} from "../schemas/userSchema.js";

/**
 * Factory de Router para Usuarios.
 * Recibe el controlador ya instanciado y los middlewares de auth.
 * Toda la gestión de usuarios es solo para administradores (cada usuario ve lo suyo en /auth/me).
 */
function createUsersRouter(controller, { authenticate, authorize }) {
  const router = express.Router();
  // Se aplica ruta por ruta (y no con router.use) para que una URL inexistente dentro de /users devuelva 404, no 401/403
  const adminOnly = [authenticate, authorize("admin")];

  router.get("/", adminOnly, validateQuery(queryUsersSchema), controller.list);
  router.get("/:id", adminOnly, validateParams(userIdParamSchema), validateQuery(queryUserByIdSchema), controller.get);
  router.post("/", adminOnly, validate(createUserSchema), controller.create);
  router.put("/:id", adminOnly, validateParams(userIdParamSchema), validate(updateUserSchema), controller.update);
  router.delete("/:id", adminOnly, validateParams(userIdParamSchema), controller.remove);

  return router;
}

export default createUsersRouter;
