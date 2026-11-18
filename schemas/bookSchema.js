import { z } from "zod";

/**
 * Schemas de Zod para libros (Ej. 4).
 * Cada campo se define UNA vez y se reutiliza en los dos schemas.
 */
const fields = {
  title: z.string({ error: "Title is required" }).min(1, "Title cannot be empty"),
  author: z.string({ error: "Author is required" }).min(1, "Author cannot be empty"),
  // Desafío: si viene, exactamente 13 dígitos
  isbn: z.string({ error: "ISBN must be a string" }).regex(/^\d{13}$/, "ISBN must be exactly 13 digits"),
  stock: z
    .number({ error: "Stock must be a number" })
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),
};

// POST /books: title y author obligatorios, isbn opcional, stock con default 0
const createBookSchema = z.object({
  title: fields.title,
  author: fields.author,
  isbn: fields.isbn.optional(),
  stock: fields.stock.default(0),
});

// PUT /books/:id: todo opcional y stock SIN default.
// No se usa createBookSchema.partial() porque el .default(0) seguiría aplicándose
// y un update que no trae stock lo pisaría con 0.
const updateBookSchema = z.object({
  title: fields.title.optional(),
  author: fields.author.optional(),
  isbn: fields.isbn.optional(),
  stock: fields.stock.optional(),
});

// Desafío: query params del listado. Llegan como string, por eso z.coerce.
const paginationSchema = z.object({
  page: z.coerce.number().int("Page must be an integer").positive("Page must be greater than 0").default(1),
  limit: z.coerce.number().int("Limit must be an integer").positive("Limit must be greater than 0").max(100, "Limit cannot exceed 100").default(20),
});

export { createBookSchema, updateBookSchema, paginationSchema };
