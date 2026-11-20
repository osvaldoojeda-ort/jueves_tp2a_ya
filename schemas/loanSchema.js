import { z } from "zod";

const id = (label) =>
  z.number({ error: `${label} debe ser un número` }).int(`${label} debe ser un entero`).positive(`${label} debe ser positivo`);

// Esquema para POST /loans
// userId es opcional: por defecto el préstamo es para quien hace el pedido (solo un admin puede indicar otro usuario)
const createLoanSchema = z.object({
  userId: id("userId").meta({ description: "Solo admin: a nombre de quién va el préstamo. Si se omite, es para quien hace el pedido" }).optional(),
  bookId: id("bookId"),
});

// Filtro reutilizable: true = préstamos sin devolver, false = ya devueltos
const activosSchema = z
  .enum(["true", "false"], { error: "activos debe ser 'true' o 'false'" })
  .transform((v) => v === "true");

// Fecha sin hora (AAAA-MM-DD): para días, no para instantes
const dateOnly = z.iso.date({ error: "La fecha debe tener formato AAAA-MM-DD" });

// Esquema para req.query en GET /loans (filtros opcionales)
// Validación CRUZADA entre campos (Clase 13): cada fecha es válida por separado, pero la combinación puede no serlo.
// `refine` recibe el objeto completo ya parseado; `path` indica en qué campo se informa el error.
// Las cadenas AAAA-MM-DD se comparan con <= directamente porque ordenan igual que las fechas.
const queryLoansSchema = z
  .object({
    userId: z.coerce.number().int().positive().meta({ description: "Un lector solo puede pedir los suyos (otro userId → 403)" }).optional(),
    bookId: z.coerce.number().int().positive().optional(),
    activos: activosSchema.meta({ description: "`true` = sin devolver, `false` = ya devueltos" }).optional(),
    // El `refine` de abajo no llega a la documentación: la regla "desde <= hasta" se cuenta en la description
    desde: dateOnly.meta({ description: "Prestados desde este día, inclusive (no puede ser posterior a `hasta`)" }).optional(),
    hasta: dateOnly.meta({ description: "Prestados hasta este día, inclusive" }).optional(),
  })
  .refine((q) => !q.desde || !q.hasta || q.desde <= q.hasta, {
    message: "'desde' no puede ser posterior a 'hasta'",
    path: ["desde"],
  });

// Esquema para validar los parámetros de la URL (ej: /loans/:id)
const loanIdParamSchema = z.object({
  id: z.coerce.number().int("El ID debe ser un número entero").positive("El ID debe ser un número positivo"),
});

export { activosSchema, createLoanSchema, queryLoansSchema, loanIdParamSchema };
