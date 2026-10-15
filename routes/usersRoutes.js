import express from "express";
import validate, { validateParams } from "../middlewares/validate.js";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "../schemas/userSchema.js";

/**
 * Factory de Router para Usuarios.
 * Recibe el controlador ya instanciado y configura los endpoints.
 */
function createUsersRouter(controller) {
  const router = express.Router();

  router.get("/", controller.list);
  router.get("/:id", validateParams(userIdParamSchema), controller.get);
  router.post("/", validate(createUserSchema), controller.create);
  router.put("/:id", validateParams(userIdParamSchema), validate(updateUserSchema), controller.update);
  router.delete("/:id", validateParams(userIdParamSchema), controller.remove);

  return router;
}

export default createUsersRouter;
