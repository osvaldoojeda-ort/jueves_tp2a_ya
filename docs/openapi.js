import { jsonSchema } from "./zodToOpenApi.js";
import * as responseSchemas from "./responseSchemas.js";
import booksPaths from "./paths/books.js";
import usersPaths from "./paths/users.js";
import authPaths from "./paths/auth.js";
import loansPaths from "./paths/loans.js";
import catalogPaths from "./paths/catalog.js";

/**
 * Documento OpenAPI 3.1 de la API de la biblioteca (Clase 15).
 *
 * Es una función (y no un objeto exportado) por lo mismo que el resto del proyecto: lo que cambia según el entorno
 * (la URL del servidor) llega como parámetro. Así los tests la pueden llamar sin .env y sin levantar nada.
 *
 * Ejercicio 5.3 — ¿Por qué no puede importar config.js? Porque config.js lanza un error si falta JWT_SECRET: el test
 * de la documentación y el script docs:export necesitarían un secreto de tokens para describir la API, algo que no
 * tiene nada que ver. Es el mismo acoplamiento que destapó createBook en la Clase 14.
 *
 * Partes del documento:
 *  - info:       qué API es, versión, contacto.
 *  - servers:    dónde está corriendo (Swagger UI le pega a esta URL al usar "Try it out").
 *  - tags:       grupos para ordenar las operaciones en la UI.
 *  - paths:      cada URL con sus verbos (una "operación" por verbo).
 *  - components: lo reutilizable: esquemas, y cómo se autentica (securitySchemes).
 *  - security:   la autenticación por defecto. Cada operación la pisa (las públicas con `security: []`).
 */
function buildOpenApiSpec({ serverUrl = "/" } = {}) {
  const schemas = Object.fromEntries(
    Object.entries(responseSchemas).map(([name, schema]) => [name, jsonSchema(schema)])
  );

  return {
    openapi: "3.1.0",
    info: {
      title: "Biblioteca API",
      version: "1.0.0", // la versión de la API (del contrato), no la de OpenAPI ni la de Node
      description: [
        "API REST de una biblioteca: libros, usuarios y préstamos con reglas de negocio.",
        "",
        "**Autenticación:** `POST /auth/login` devuelve un JWT; se envía como `Authorization: Bearer <token>`.",
        "",
        "**Errores:** todos tienen el mismo formato `{ error: { code, message, details? } }`. " +
          "Compará el `code` (es estable); el `message` es para personas y puede cambiar. " +
          "Un error inesperado responde `500 INTERNAL_ERROR`, y una ruta inexistente `404 ROUTE_NOT_FOUND`.",
        "",
        "**Fechas:** los instantes van en UTC (ISO 8601); los días (`fechaVencimiento`, filtros `desde`/`hasta`) " +
          "como `AAAA-MM-DD` en la zona de la biblioteca (America/Argentina/Buenos_Aires).",
      ].join("\n"),
    },
    servers: [{ url: serverUrl, description: "Este servidor" }],
    tags: [
      { name: "Autenticación", description: "Registro, login y perfil" },
      { name: "Libros", description: "Inventario. Lectura pública; escritura solo admin" },
      { name: "Préstamos", description: "Pedir, devolver y renovar, con las reglas de la biblioteca" },
      { name: "Usuarios", description: "Gestión de usuarios (solo admin)" },
      { name: "Catálogo externo", description: "Consultas a Open Library" },
    ],
    paths: { ...authPaths, ...booksPaths, ...loansPaths, ...usersPaths, ...catalogPaths },
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "El `token` que devuelve `POST /auth/login`",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

export default buildOpenApiSpec;
