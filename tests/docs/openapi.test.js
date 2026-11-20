import { describe, it, expect, beforeAll } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import buildOpenApiSpec from "../../docs/openapi.js";
import createBooksRouter from "../../routes/booksRoutes.js";
import createUsersRouter from "../../routes/usersRoutes.js";
import createLoansRouter from "../../routes/loansRoutes.js";
import createAuthRouter from "../../routes/authRoutes.js";
import createCatalogRouter from "../../routes/catalogRoutes.js";

/**
 * Tests de la documentación (Clase 15).
 *
 * Una documentación escrita aparte del código tiene un enemigo: el DESFASAJE (drift). Alguien agrega una ruta y no la
 * documenta, o cambia un permiso y la documentación sigue diciendo lo de antes. Nadie se entera hasta que un cliente
 * se queja. Estos tests convierten "acordate de actualizar la documentación" en algo que se verifica solo:
 *
 *  1. El documento es OpenAPI VÁLIDO (si no, Swagger UI, Postman o un generador de clientes lo rechazan).
 *  2. Cada ruta de Express está documentada, y cada operación documentada existe en Express.
 *  3. Lo que la documentación dice sobre el acceso (público / con token / solo admin) coincide con los middlewares
 *     que la ruta tiene DE VERDAD.
 *
 * No hace falta .env ni levantar el servidor: se construyen los routers con controladores y middlewares falsos,
 * y se lee la lista de rutas que Express guarda en `router.stack`.
 *
 * Ejercicio 7.4 — Al construir createAuthRouter explotaba con "Falta la variable de entorno JWT_SECRET": el router
 * importaba LOGIN_RATE_LIMIT_MAX de config.js. Es el mismo problema que createBook en la Clase 14: una pieza que
 * depende de TODA la configuración por un solo valor. Mismo arreglo: el valor llega por parámetro desde el contenedor.
 *
 * Ejercicio 7.5 — Si un bug dejara la lista de rutas vacía, "cada ruta está documentada" recorrería cero rutas y
 * pasaría en VERDE sin verificar nada. Por eso el beforeAll exige que haya más de 20.
 */

// --- Dobles: middlewares reconocibles y un controlador que responde a cualquier método ---
function authenticate(req, res, next) {
  next();
}
const authorize = (...roles) => Object.assign((req, res, next) => next(), { roles });
const auth = { authenticate, authorize };
const anyController = new Proxy({}, { get: () => (req, res) => res.end() });

// Dónde se monta cada router: tiene que coincidir con container/container.js
const MOUNTS = [
  ["/books", createBooksRouter(anyController, auth)],
  ["/users", createUsersRouter(anyController, auth)],
  ["/loans", createLoansRouter(anyController, auth)],
  ["/auth", createAuthRouter(anyController, auth)],
  ["/catalog", createCatalogRouter(anyController, auth)],
];

// "/books" + "/:id/details" → "/books/{id}/details" (sintaxis de OpenAPI)
const toOpenApiPath = (prefix, path) => (prefix + (path === "/" ? "" : path)).replace(/:(\w+)/g, "{$1}");

// Lista de rutas reales: { key: "GET /books/{id}", access: "public" | "user" | "admin" }
function expressRoutes() {
  return MOUNTS.flatMap(([prefix, router]) =>
    router.stack
      .filter((layer) => layer.route)
      .flatMap((layer) => {
        const handlers = layer.route.stack.map((l) => l.handle);
        const roles = handlers.find((h) => Array.isArray(h.roles))?.roles;
        const access = roles ? "admin" : handlers.includes(authenticate) ? "user" : "public";
        return Object.keys(layer.route.methods).map((method) => ({
          key: `${method.toUpperCase()} ${toOpenApiPath(prefix, layer.route.path)}`,
          access,
        }));
      })
  );
}

// Lista de operaciones documentadas: { key, access, operation }
function documentedOperations(spec) {
  return Object.entries(spec.paths).flatMap(([path, item]) =>
    Object.entries(item).map(([method, operation]) => {
      const roles = operation["x-roles"];
      const access = operation.security.length === 0 ? "public" : roles.includes("lector") ? "user" : "admin";
      return { key: `${method.toUpperCase()} ${path}`, access, operation };
    })
  );
}

const spec = buildOpenApiSpec();
const documented = documentedOperations(spec);
const routes = expressRoutes();

describe("documento OpenAPI", () => {
  it("es un documento OpenAPI 3.1 válido", async () => {
    // validate() modifica el objeto (resuelve los $ref): se le pasa una copia
    await expect(SwaggerParser.validate(structuredClone(spec))).resolves.toBeDefined();
  });

  it("cada operationId es único", () => {
    const ids = documented.map((d) => d.operation.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(documented.map((d) => [d.key, d.operation]))("%s documenta al menos una respuesta 2xx", (_, operation) => {
    expect(Object.keys(operation.responses).some((status) => status.startsWith("2"))).toBe(true);
  });

  it.each(documented.filter((d) => d.access !== "public").map((d) => [d.key, d.operation]))(
    "%s, que exige token, documenta el 401",
    (_, operation) => {
      expect(operation.responses).toHaveProperty("401");
    }
  );
});

describe("la documentación coincide con las rutas de Express", () => {
  beforeAll(() => {
    // Si el test no encuentra rutas, el resto pasaría "en verde" sin verificar nada (Clase 14: verlo en rojo)
    expect(routes.length).toBeGreaterThan(20);
  });

  it("cada ruta de Express está documentada", () => {
    const documentedKeys = documented.map((d) => d.key);
    const missing = routes.map((r) => r.key).filter((key) => !documentedKeys.includes(key));
    expect(missing, "Rutas sin documentar").toEqual([]);
  });

  it("cada operación documentada existe en Express", () => {
    const routeKeys = routes.map((r) => r.key);
    const ghosts = documented.map((d) => d.key).filter((key) => !routeKeys.includes(key));
    expect(ghosts, "Operaciones documentadas que no existen").toEqual([]);
  });

  it.each(routes.map((r) => [r.key, r.access]))("%s: el acceso documentado es '%s', igual que en el router", (key, access) => {
    const doc = documented.find((d) => d.key === key);
    expect(doc?.access).toBe(access);
  });
});
