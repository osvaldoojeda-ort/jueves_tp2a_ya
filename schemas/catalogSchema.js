import { z } from "zod";

// Esquema para req.query en GET /catalog/lookup
// Acá NO se exige el dígito de control (Clase 13): es una CONSULTA, no un dato que se guarda, y el catálogo fake
// usa ISBN que empiezan con 000 (inválidos a propósito) para simular fallas. Al crear o importar libros sí se exige.
// isbns llega como texto separado por comas (?isbns=978...,978...) y se transforma en arreglo
const lookupQuerySchema = z.object({
  isbns: z
    .string({ error: "isbns es obligatorio (separados por coma)" })
    .meta({ description: "Entre 1 y 10 ISBN de 13 dígitos, separados por coma", examples: ["9780156012195,9780060883287"] })
    .transform((value) => [...new Set(value.split(",").map((isbn) => isbn.trim()).filter(Boolean))])
    .pipe(
      z
        .array(z.string().regex(/^\d{13}$/, "Cada ISBN debe tener exactamente 13 dígitos"))
        .min(1, "Enviá al menos un ISBN")
        .max(10, "Se pueden consultar hasta 10 ISBN por pedido")
    ),
  mode: z
    .enum(["sequential", "parallel", "batch"], { error: "mode debe ser sequential, parallel o batch" })
    .meta({ description: "Estrategia de consulta: de a uno, todos a la vez, o un único pedido en lote" })
    .default("parallel"),
});

export { lookupQuerySchema };
