import express from "express";
import { validateQuery } from "../middlewares/validate.js";
import { lookupQuerySchema } from "../schemas/catalogSchema.js";

/**
 * Factory de Router del catálogo externo.
 * Cada consulta dispara pedidos a una API de terceros, por eso exige estar autenticado.
 */
function createCatalogRouter(controller, { authenticate }) {
  const router = express.Router();

  router.get("/lookup", authenticate, validateQuery(lookupQuerySchema), controller.lookup);

  return router;
}

export default createCatalogRouter;
