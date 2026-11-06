import { z } from "zod";

// Esquema para req.query en GET /catalog/lookup
// Acá NO se exige el dígito de control (Clase 13): es una CONSULTA, no un dato que se guarda, y el catálogo fake
// usa ISBN que empiezan con 000 (inválidos a propósito) para simular fallas. Al crear o importar libros sí se exige.
// isbns llega como texto separado por comas (?isbns=978...,978...) y se transforma en arreglo
const lookupQuerySchema = z.object({
  isbns: z
    .string({ error: "isbns es obligatorio (separados por coma)" })
    .transform((value) => [...new Set(value.split(",").map((isbn) => isbn.trim()).filter(Boolean))])
    .pipe(
      z
        .array(z.string().regex(/^\d{13}$/, "Cada ISBN debe tener exactamente 13 dígitos"))
        .min(1, "Enviá al menos un ISBN")
        .max(10, "Se pueden consultar hasta 10 ISBN por pedido")
    ),
  mode: z.enum(["sequential", "parallel", "batch"], { error: "mode debe ser sequential, parallel o batch" }).default("parallel"),
});

export { lookupQuerySchema };
