import { z } from "zod";

/**
 * Esquemas de RESPUESTA (Clase 15).
 *
 * Los esquemas de `schemas/` describen lo que ENTRA (y lo validan). Estos describen lo que SALE.
 * Se escriben con Zod por dos motivos:
 *  1. Se traducen a JSON Schema con la misma función que los de entrada (docs/zodToOpenApi.js).
 *  2. Se pueden EJECUTAR: los tests de contrato (tests/contract/) pasan la respuesta real de cada caso de uso por
 *     estos esquemas. Si un caso de uso empieza a devolver un campo nuevo, o deja de devolver uno, el test falla y
 *     avisa que la documentación quedó vieja.
 *
 * Se usan objetos ESTRICTOS (`z.strictObject`): un campo que no está documentado hace fallar el test.
 * Así, por ejemplo, si un día `passwordHash` se filtra en la respuesta de un usuario, nos enteramos en el test.
 *
 * Las fechas se describen como TEXTO porque eso es lo que viaja en el JSON: el caso de uso devuelve un `Date`,
 * pero `res.json()` lo serializa como "2026-11-04T15:00:00.000Z". Los tests comparan contra lo serializado.
 */

const id = z.number().int().positive();
const instant = z.iso.datetime().meta({ description: "Instante en UTC (ISO 8601)", examples: ["2026-11-04T15:00:00.000Z"] });
const day = z.iso.date().meta({ description: "Día sin hora (AAAA-MM-DD), en la zona de la biblioteca", examples: ["2026-11-19"] });

// --- Libros ---
const bookFields = {
  id,
  titulo: z.string().meta({ examples: ["El principito"] }),
  autor: z.string().meta({ examples: ["Saint-Exupéry"] }),
  isbn: z.string().nullable().meta({ examples: ["9780156012195"] }),
  stock: z.number().int().min(0).meta({ description: "Ejemplares disponibles para prestar", examples: [3] }),
};

const Book = z.strictObject(bookFields);

// GET /books?incluir=usuarios: cada libro trae quién lo tiene o lo tuvo
const BookWithUsers = z.strictObject({
  ...bookFields,
  usuarios: z
    .array(z.strictObject({ id, nombre: z.string(), fechaPrestamo: instant, fechaDevolucion: instant.nullable() }))
    .optional()
    .meta({ description: "Solo con `incluir=usuarios`" }),
});

// Lo que devuelve el catálogo externo, ya traducido a nuestro modelo (gateway, Clase 12)
const CatalogInfo = z.strictObject({
  isbn: z.string(),
  titulo: z.string().nullable(),
  autores: z.array(z.string()),
  editorial: z.string().nullable(),
  fechaPublicacion: z.string().nullable().meta({ description: "Tal como la informa el catálogo (texto libre)" }),
  paginas: z.number().int().nullable(),
  portada: z.string().nullable(),
  url: z.string().nullable(),
});

const BookDetails = z.strictObject({
  ...bookFields,
  externalInfo: CatalogInfo.nullable(),
  externalStatus: z
    .enum(["ok", "not_found", "no_isbn", "unavailable"])
    .meta({ description: "`unavailable`: el catálogo no respondió, pero el libro local igual se devuelve (200)" }),
});

const ImportReport = z.strictObject({
  imported: z.array(Book),
  skipped: z.array(z.strictObject({ isbn: z.string(), reason: z.literal("ISBN_DUPLICATE") })),
  notFound: z.array(z.strictObject({ isbn: z.string() })),
  failed: z.array(z.strictObject({ isbn: z.string(), code: z.string(), message: z.string() })),
});

const LookupResult = z.strictObject({
  mode: z.enum(["sequential", "parallel", "batch"]),
  requested: z.number().int(),
  httpRequests: z.number().int().meta({ description: "Cuántos pedidos HTTP se hicieron al catálogo externo" }),
  elapsedMs: z.number().int(),
  results: z.array(
    z.strictObject({
      isbn: z.string(),
      status: z.enum(["found", "not_found", "failed"]),
      info: CatalogInfo.optional(),
      error: z.strictObject({ code: z.string(), message: z.string() }).optional(),
    })
  ),
});

// --- Usuarios ---
const userFields = {
  id,
  nombre: z.string().meta({ examples: ["Ana Pérez"] }),
  email: z.email().meta({ examples: ["ana@mail.com"] }),
  rol: z.enum(["lector", "admin"]),
};

// Sin passwordHash: nunca sale de la API (y el objeto estricto lo garantiza en los tests)
const User = z.strictObject(userFields);

const UserWithBooks = z.strictObject({
  ...userFields,
  libros: z
    .array(z.strictObject({ id, titulo: z.string(), fechaPrestamo: instant, fechaDevolucion: instant.nullable() }))
    .optional()
    .meta({ description: "Solo con `incluir=libros`" }),
});

const LoginResponse = z.strictObject({
  token: z.string().meta({ description: "JWT. Se manda en cada pedido como `Authorization: Bearer <token>`" }),
  user: User,
});

// --- Préstamos ---
const Loan = z.strictObject({
  id,
  userId: id,
  bookId: id,
  fechaPrestamo: instant,
  fechaVencimiento: day,
  fechaDevolucion: instant.nullable(),
  renovaciones: z.number().int().min(0),
  usuario: z.strictObject({ id, nombre: z.string() }).nullable(),
  libro: z.strictObject({ id, titulo: z.string() }).nullable(),
  estado: z.enum(["activo", "vencido", "devuelto"]).meta({ description: "Calculado, no guardado: depende del día de hoy" }),
  diasAtraso: z.number().int().min(0),
  holidaysAvailable: z
    .boolean()
    .optional()
    .meta({ description: "Solo al prestar o renovar. `false`: la API de feriados no respondió y el vencimiento se calculó sin feriados" }),
  // Lo encontró el test de contrato: returnLoan lo devolvía y nadie lo había documentado.
  // Al devolver, `diasAtraso` ya es 0 (el préstamo está "devuelto"): este campo guarda con cuánto atraso llegó.
  atrasoAlDevolver: z
    .number()
    .int()
    .min(0)
    .optional()
    .meta({ description: "Solo al devolver: con cuántos días de atraso se devolvió (0 si llegó a tiempo)" }),
});

// --- Errores: el formato estándar de toda la API (errorHandler, Clase 6) ---
const ErrorResponse = z.strictObject({
  error: z.strictObject({
    code: z.string().meta({ description: "Código estable para que el cliente decida qué hacer", examples: ["BOOK_NOT_FOUND"] }),
    message: z.string().meta({ description: "Texto para personas: puede cambiar, no lo compares en el código" }),
    details: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .meta({ description: "En VALIDATION_ERROR: un elemento por campo inválido ({ field, message })" }),
  }),
});

export {
  Book,
  BookWithUsers,
  BookDetails,
  CatalogInfo,
  ImportReport,
  LookupResult,
  User,
  UserWithBooks,
  LoginResponse,
  Loan,
  ErrorResponse,
};
