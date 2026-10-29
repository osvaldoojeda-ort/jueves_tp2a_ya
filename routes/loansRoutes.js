import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import { createLoanSchema, queryLoansSchema, loanIdParamSchema } from "../schemas/loanSchema.js";

/**
 * Factory de Router para Préstamos.
 * Requiere token; qué puede ver o hacer cada rol lo deciden los casos de uso.
 */
function createLoansRouter(controller, { authenticate }) {
  const router = express.Router();

  router.get("/", authenticate, validateQuery(queryLoansSchema), controller.list);
  router.get("/:id", authenticate, validateParams(loanIdParamSchema), controller.get);
  router.post("/", authenticate, validate(createLoanSchema), controller.create);
  router.put("/:id/return", authenticate, validateParams(loanIdParamSchema), controller.giveBack);

  return router;
}

export default createLoansRouter;
