import { operation, ref, arrayOf, json } from "../operation.js";
import {
  createBookSchema,
  updateBookSchema,
  queryBooksSchema,
  queryBookByIdSchema,
  exportBooksQuerySchema,
  importBooksSchema,
  bookIdParamSchema,
} from "../../schemas/bookSchema.js";

const tag = "Libros";

// Ejercicio 4.4 — ¿Por qué POST /books/import responde 200 aunque algunos ISBN fallen?
// Porque el PEDIDO salió bien: se procesaron todos los ISBN y cada uno tiene su resultado. Que Open Library no
// conozca uno, o falle para otro, no es un error del pedido sino un dato del informe. Si respondiera 502 porque
// falló uno de diez, el cliente no sabría que los otros nueve SÍ se importaron. El detalle está en `failed` y `notFound`.
//
// ¿Por qué GET /books/:id/details responde 200 con el catálogo caído? Porque el libro local existe y lo tenemos
// (degradación elegante, Clase 12). Se documenta en la description y en el enum de `externalStatus`, con la
// explicación de "unavailable" en el esquema BookDetails.

// Las claves usan la sintaxis de OpenAPI ({id}), no la de Express (:id)
export default {
  "/books": {
    get: operation({
      tag,
      id: "listBooks",
      summary: "Listar libros",
      description: "Filtros, orden y paginación. Sin `limit` devuelve todos.",
      query: queryBooksSchema,
      responses: { 200: json("Libros que cumplen los filtros", arrayOf(ref("BookWithUsers"))) },
    }),
    post: operation({
      tag,
      id: "createBook",
      summary: "Crear un libro",
      description: "Si el stock inicial queda en el umbral o por debajo, se emite una alerta de stock bajo.",
      auth: "admin",
      body: createBookSchema,
      bodyExample: { titulo: "Ficciones", autor: "Jorge Luis Borges", isbn: "9789500700122", stock: 5 },
      responses: { 201: json("Libro creado", ref("Book")) },
      errors: ["ISBN_DUPLICATE"],
    }),
  },

  "/books/export.csv": {
    get: operation({
      tag,
      id: "exportBooksCsv",
      summary: "Exportar libros a CSV",
      description:
        "Mismos filtros que el listado. Con `enriquecer=true` consulta el catálogo externo en un solo pedido; " +
        "si el catálogo no responde, igual exporta lo local y lo avisa en el header `X-Enrichment`.",
      auth: "admin",
      query: exportBooksQuerySchema,
      responses: {
        200: {
          description: "Archivo CSV (UTF-8 con BOM, filas separadas por CRLF)",
          headers: {
            "Content-Disposition": { description: "attachment; filename=\"libros-AAAA-MM-DD.csv\"", schema: { type: "string" } },
            "X-Enrichment": {
              description: "`ok`, `unavailable` (el catálogo no respondió) o `skipped` (no se pidió enriquecer)",
              schema: { type: "string", enum: ["ok", "unavailable", "skipped"] },
            },
          },
          content: {
            "text/csv": {
              schema: { type: "string" },
              example: "id,titulo,autor,isbn,stock\r\n1,El principito,Saint-Exupéry,9780156012195,3\r\n",
            },
          },
        },
      },
    }),
  },

  "/books/import": {
    post: operation({
      tag,
      id: "importBooks",
      summary: "Importar libros por ISBN desde el catálogo externo",
      description:
        "Cada ISBN tiene su propio resultado: uno que falla no cancela a los demás. Por eso la respuesta es **200** " +
        "aunque algunos fallen: el detalle está en el informe (`imported`, `skipped`, `notFound`, `failed`).",
      auth: "admin",
      body: importBooksSchema,
      bodyExample: { isbns: ["9780156012195", "9780140328721"], stock: 3 },
      responses: { 200: json("Informe de la importación", ref("ImportReport")) },
    }),
  },

  "/books/{id}/details": {
    get: operation({
      tag,
      id: "getBookDetails",
      summary: "Detalle de un libro con datos del catálogo externo",
      description: "Si el catálogo externo no responde, igual devuelve **200** con `externalStatus: \"unavailable\"`.",
      auth: "user",
      params: bookIdParamSchema,
      responses: { 200: json("Libro con la información externa", ref("BookDetails")) },
      errors: ["BOOK_NOT_FOUND"],
    }),
  },

  "/books/{id}": {
    get: operation({
      tag,
      id: "getBook",
      summary: "Obtener un libro",
      params: bookIdParamSchema,
      query: queryBookByIdSchema,
      responses: { 200: json("El libro", ref("BookWithUsers")) },
      errors: ["BOOK_NOT_FOUND"],
    }),
    put: operation({
      tag,
      id: "updateBook",
      summary: "Actualizar un libro (parcial)",
      description: "Solo se modifican los campos enviados.",
      auth: "admin",
      params: bookIdParamSchema,
      body: updateBookSchema,
      bodyExample: { stock: 2 },
      responses: { 200: json("Libro actualizado", ref("Book")) },
      // ISBN_DUPLICATE apareció AL DOCUMENTAR: ¿qué pasa si mando el ISBN de otro libro? (ver el material, sección 9)
      errors: ["INVALID_STOCK", "BOOK_NOT_FOUND", "ISBN_DUPLICATE"],
    }),
    delete: operation({
      tag,
      id: "deleteBook",
      summary: "Eliminar un libro",
      auth: "admin",
      params: bookIdParamSchema,
      responses: { 204: { description: "Eliminado (sin cuerpo)" } },
      errors: ["BOOK_NOT_FOUND", "BOOK_HAS_LOANS"],
    }),
  },
};
