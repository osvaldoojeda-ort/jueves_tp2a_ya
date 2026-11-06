import { z } from "zod";
import { activosSchema } from "./loanSchema.js";
import { hasValidIsbn13Checksum } from "../utils/isbn.js";

// Definición de campos reutilizables
const fields = {
  titulo: z.string({ error: "El título es obligatorio" }).min(1, "El título no puede estar vacío"),
  autor: z.string({ error: "El autor es obligatorio" }).min(1, "El autor no puede estar vacío"),
  // Dos pasos encadenados (Clase 13): primero la forma (13 dígitos) y recién después la cuenta del dígito de control.
  // Sigue siendo una validación de FORMA: se decide mirando solo el dato, sin consultar nada.
  isbn: z
    .string()
    .regex(/^\d{13}$/, "El ISBN debe tener exactamente 13 dígitos")
    .refine(hasValidIsbn13Checksum, "El ISBN tiene un dígito de control inválido"),
  stock: z
    .number({ error: "El stock debe ser un número" })
    .int("El stock debe ser un número entero"),
};

// Esquema para POST /books
// El stock inicial no puede ser negativo: se valida acá porque es una regla de forma del dato de entrada.
const createBookSchema = z.object({
  titulo: fields.titulo,
  autor: fields.autor,
  isbn: fields.isbn.optional(),
  stock: fields.stock.nonnegative("El stock no puede ser negativo").default(0),
});

// Esquema para PUT /books/:id (actualización parcial)
// Acá el stock NO se valida como no-negativo: esa regla es de negocio y vive en usecases/books/updateBook.js,
// para dejar la demostración de "regla de negocio vs. validación de forma" del ejercicio.
const updateBookSchema = z.object({
  titulo: fields.titulo.optional(),
  autor: fields.autor.optional(),
  isbn: fields.isbn.optional(),
  stock: fields.stock.optional(),
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
  // Solo columnas reales: el DAO las usa tal cual en el ORDER BY
  sort: z
    .string()
    .regex(/^-?(id|titulo|autor|isbn|stock)$/, "sort debe ser id, titulo, autor, isbn o stock (con '-' para descendente)")
    .optional(),
  incluir: z.enum(["usuarios"], { error: "incluir solo admite 'usuarios'" }).optional(),
  activos: activosSchema.optional(), // solo aplica junto con incluir=usuarios
  page: z.coerce.number().int("La página debe ser un entero").positive("La página debe ser mayor a 0").optional(),
  limit: z.coerce.number().int("El límite debe ser un entero").positive("El límite debe ser mayor a 0").max(100, "El límite máximo es 100").optional(),
});

// Esquema para req.query en GET /books/export.csv: los mismos filtros del listado + enriquecer con el catálogo externo
const exportBooksQuerySchema = queryBooksSchema
  .pick({ autor: true, author: true, isbn: true, sort: true, page: true, limit: true })
  .extend({
    enriquecer: activosSchema.optional(), // "true" / "false"
    separador: z.enum([",", ";"], { error: "separador debe ser ',' o ';'" }).default(","), // ";" para Excel en español
  });

// Esquema para POST /books/import (hasta 10 ISBN por pedido: cada uno es un pedido HTTP a la API externa)
const importBooksSchema = z.object({
  isbns: z
    .array(fields.isbn, { error: "isbns debe ser un arreglo de ISBN" })
    .min(1, "Enviá al menos un ISBN")
    .max(10, "Se pueden importar hasta 10 ISBN por pedido"),
  stock: fields.stock.nonnegative("El stock no puede ser negativo").default(3),
});

// Esquema para req.query en GET /books/:id
const queryBookByIdSchema = z.object({
  incluir: z.enum(["usuarios"], { error: "incluir solo admite 'usuarios'" }).optional(),
  activos: activosSchema.optional(),
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
  queryBookByIdSchema,
  exportBooksQuerySchema,
  importBooksSchema,
  bookIdParamSchema,
};
