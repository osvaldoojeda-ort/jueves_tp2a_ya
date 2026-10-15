import { z } from "zod";

// Definición de campos reutilizables
const fields = {
  titulo: z.string({ error: "El título es obligatorio" }).min(1, "El título no puede estar vacío"),
  autor: z.string({ error: "El autor es obligatorio" }).min(1, "El autor no puede estar vacío"),
  isbn: z.string().regex(/^\d{13}$/, "El ISBN debe tener exactamente 13 dígitos"),
  stock: z
    .number({ error: "El stock debe ser un número" })
    .int("El stock debe ser un número entero"),
  // Usuario propietario del libro; null lo deja sin asignar
  userId: z
    .number({ error: "El userId debe ser un número" })
    .int("El userId debe ser un número entero")
    .positive("El userId debe ser positivo")
    .nullable(),
};

// Esquema para POST /books
// El stock inicial no puede ser negativo: se valida acá porque es una regla de forma del dato de entrada.
const createBookSchema = z.object({
  titulo: fields.titulo,
  autor: fields.autor,
  isbn: fields.isbn.optional(),
  stock: fields.stock.nonnegative("El stock no puede ser negativo").default(0),
  userId: fields.userId.optional(),
});

// Esquema para PUT /books/:id (actualización parcial)
// Acá el stock NO se valida como no-negativo: esa regla es de negocio y vive en usecases/books/updateBook.js,
// para dejar la demostración de "regla de negocio vs. validación de forma" del ejercicio.
const updateBookSchema = z.object({
  titulo: fields.titulo.optional(),
  autor: fields.autor.optional(),
  isbn: fields.isbn.optional(),
  stock: fields.stock.optional(),
  userId: fields.userId.optional(),
});

// Esquema de paginación para query params
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Esquema completo para req.query en GET /books (filtros, ordenamiento y paginación)
const queryBooksSchema = z.object({
  autor: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int("La página debe ser un entero").positive("La página debe ser mayor a 0").optional(),
  limit: z.coerce.number().int("El límite debe ser un entero").positive("El límite debe ser mayor a 0").max(100, "El límite máximo es 100").optional(),
});

// Esquema para validar los parámetros de la URL (ej: /books/:id)
const bookIdParamSchema = z.object({
  id: z.coerce.number().int("El ID debe ser un número entero").positive("El ID debe ser un número positivo"),
});

export {
  createBookSchema,
  updateBookSchema,
  paginationSchema,
  queryBooksSchema,
  bookIdParamSchema,
};
