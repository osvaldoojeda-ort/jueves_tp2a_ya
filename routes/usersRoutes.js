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
 * Recibe el controlador ya instanciado y configura los endpoints.
 */
function createUsersRouter(controller) {
  const router = express.Router();

  router.get("/", validateQuery(queryUsersSchema), controller.list);
  router.get("/:id", validateParams(userIdParamSchema), validateQuery(queryUserByIdSchema), controller.get);
  router.post("/", validate(createUserSchema), controller.create);
  router.put("/:id", validateParams(userIdParamSchema), validate(updateUserSchema), controller.update);
  router.delete("/:id", validateParams(userIdParamSchema), controller.remove);

  return router;
}

export default createUsersRouter;
