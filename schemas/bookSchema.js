import { z } from "zod";
import { activosSchema } from "./loanSchema.js";
import { hasValidIsbn13Checksum } from "../utils/isbn.js";

// Definición de campos reutilizables
const fields = {
  titulo: z.string({ error: "El título es obligatorio" }).min(1, "El título no puede estar vacío").meta({ examples: ["Ficciones"] }),
  autor: z.string({ error: "El autor es obligatorio" }).min(1, "El autor no puede estar vacío").meta({ examples: ["Jorge Luis Borges"] }),
  // Dos pasos encadenados (Clase 13): primero la forma (13 dígitos) y recién después la cuenta del dígito de control.
  // Sigue siendo una validación de FORMA: se decide mirando solo el dato, sin consultar nada.
  isbn: z
    .string()
    .regex(/^\d{13}$/, "El ISBN debe tener exactamente 13 dígitos")
    .refine(hasValidIsbn13Checksum, "El ISBN tiene un dígito de control inválido")
    // Clase 15: el `refine` no se puede expresar en JSON Schema y desaparece de la documentación.
    // La `description` es la forma de que el cliente se entere de la regla sin leer nuestro código.
    .meta({ description: "ISBN-13: 13 dígitos con dígito de control válido", examples: ["9789500700122"] }),
  stock: z
    .number({ error: "El stock debe ser un número" })
    .int("El stock debe ser un número entero")
    .meta({ examples: [5] }),
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
  autor: z.string().meta({ description: "Filtra por autor (coincidencia parcial, sin distinguir mayúsculas)" }).optional(),
  author: z.string().meta({ description: "Alias de `autor`" }).optional(),
  isbn: z.string().meta({ description: "Filtra por ISBN exacto" }).optional(),
  // Solo columnas reales: el DAO las usa tal cual en el ORDER BY
  sort: z
    .string()
    .regex(/^-?(id|titulo|autor|isbn|stock)$/, "sort debe ser id, titulo, autor, isbn o stock (con '-' para descendente)")
    .meta({ description: "Campo de orden; con `-` adelante es descendente", examples: ["-titulo"] })
    .optional(),
  incluir: z.enum(["usuarios"], { error: "incluir solo admite 'usuarios'" }).meta({ description: "Agrega a cada libro los usuarios que lo tienen o lo tuvieron" }).optional(),
  activos: activosSchema.meta({ description: "Solo junto con `incluir`: `true` = préstamos sin devolver, `false` = devueltos" }).optional(),
  page: z.coerce.number().int("La página debe ser un entero").positive("La página debe ser mayor a 0").optional(),
  limit: z.coerce.number().int("El límite debe ser un entero").positive("El límite debe ser mayor a 0").max(100, "El límite máximo es 100").optional(),
});

// Esquema para req.query en GET /books/export.csv: los mismos filtros del listado + enriquecer con el catálogo externo
const exportBooksQuerySchema = queryBooksSchema
  .pick({ autor: true, author: true, isbn: true, sort: true, page: true, limit: true })
  .extend({
    enriquecer: activosSchema.meta({ description: "`true` agrega editorial, páginas y fecha de publicación desde el catálogo externo" }).optional(),
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
