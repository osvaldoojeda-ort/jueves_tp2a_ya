import express from "express";
import validate, { validateQuery, validateParams } from "../middlewares/validate.js";
import { createLoanSchema, queryLoansSchema, loanIdParamSchema } from "../schemas/loanSchema.js";

/**
 * Factory de Router para Préstamos.
 */
function createLoansRouter(controller) {
  const router = express.Router();

  router.get("/", validateQuery(queryLoansSchema), controller.list);
  router.get("/:id", validateParams(loanIdParamSchema), controller.get);
  router.post("/", validate(createLoanSchema), controller.create);
  router.put("/:id/return", validateParams(loanIdParamSchema), controller.giveBack);

  return router;
}

export default createLoansRouter;
