import { z } from "zod";

const id = (label) =>
  z.number({ error: `${label} debe ser un número` }).int(`${label} debe ser un entero`).positive(`${label} debe ser positivo`);

// Esquema para POST /loans
const createLoanSchema = z.object({
  userId: id("userId"),
  bookId: id("bookId"),
});

// Filtro reutilizable: true = préstamos sin devolver, false = ya devueltos
const activosSchema = z
  .enum(["true", "false"], { error: "activos debe ser 'true' o 'false'" })
  .transform((v) => v === "true");

// Esquema para req.query en GET /loans (filtros opcionales)
const queryLoansSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  bookId: z.coerce.number().int().positive().optional(),
  activos: activosSchema.optional(),
});

// Esquema para validar los parámetros de la URL (ej: /loans/:id)
const loanIdParamSchema = z.object({
  id: z.coerce.number().int("El ID debe ser un número entero").positive("El ID debe ser un número positivo"),
});

export { activosSchema, createLoanSchema, queryLoansSchema, loanIdParamSchema };
