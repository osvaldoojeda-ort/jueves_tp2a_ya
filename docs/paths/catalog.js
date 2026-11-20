import { operation, ref, json } from "../operation.js";
import { lookupQuerySchema } from "../../schemas/catalogSchema.js";

export default {
  "/catalog/lookup": {
    get: operation({
      tag: "Catálogo externo",
      id: "lookupIsbns",
      summary: "Consultar ISBN en el catálogo externo (Open Library)",
      description:
        "Sirve para comparar estrategias de consulta: el resultado es el mismo, cambia el tiempo y la cantidad de pedidos. " +
        "Cada ISBN trae su propio `status`: que uno falle no tira abajo a los demás (salvo en `batch`, que es todo o nada).",
      auth: "user",
      query: lookupQuerySchema,
      responses: { 200: json("Resultado por ISBN, con tiempos", ref("LookupResult")) },
    }),
  },
};
