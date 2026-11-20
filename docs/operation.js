import { body, query, path } from "./zodToOpenApi.js";
import { ERROR_CATALOG, errorExample } from "./errorCatalog.js";

/**
 * Arma una operación de OpenAPI (un verbo de un path) a partir de una descripción corta (Clase 15).
 *
 * En el material escribimos primero una operación "a mano" y vimos que cada endpoint protegido repite lo mismo:
 * `security`, el 401 con sus tres códigos, el 403 si es solo admin, el 400 si valida algo...
 * Este helper aplica esas reglas en un solo lugar, igual que el middleware `authenticate` aplica la autenticación
 * en un solo lugar en lugar de copiarla en cada controller.
 *
 *   auth: "public"  → sin token
 *         "user"    → cualquier usuario con token válido (401 si no)
 *         "admin"   → además, rol admin (403 si no)
 *
 * El resultado es OpenAPI estándar: no hay magia, se puede ver completo en GET /openapi.json.
 */

// Ejercicio 3.3 — ¿Por qué un `code` mal escrito tiene que hacer fallar el armado del documento?
// Porque si apareciera tal cual en Swagger UI ("LOAN_LIMIT_REACHD"), el cliente programaría contra un código que la
// API nunca devuelve, y nadie se enteraría hasta que el caso real ocurra. Fallando al armar el documento, el error
// aparece en el primer `npm test` (el test de documentación llama a buildOpenApiSpec) o al arrancar el servidor.

const STATUS_TEXT = {
  400: "Pedido inválido",
  401: "No autenticado",
  403: "Sin permiso",
  404: "No encontrado",
  409: "Conflicto con el estado actual o con una regla de negocio",
  429: "Demasiados intentos",
  502: "Falló el servicio externo",
  504: "El servicio externo no respondió a tiempo",
};

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (schema) => ({ type: "array", items: schema });

// Respuesta exitosa en JSON
const json = (description, schema, extra = {}) => ({ description, content: { "application/json": { schema } }, ...extra });

// Agrupa los códigos de error por status: cada status es UNA respuesta, con un ejemplo por cada código posible
function errorResponses(codes) {
  const byStatus = {};
  for (const code of codes) {
    if (!ERROR_CATALOG[code]) throw new Error(`Código de error sin documentar en errorCatalog.js: ${code}`);
    const [status] = ERROR_CATALOG[code];
    (byStatus[status] ??= []).push(code);
  }

  return Object.fromEntries(
    Object.entries(byStatus).map(([status, statusCodes]) => [
      status,
      {
        description: `${STATUS_TEXT[status]}: ${statusCodes.map((c) => `\`${c}\``).join(", ")}`,
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            examples: Object.fromEntries(statusCodes.map((c) => [c, { summary: c, value: errorExample(c) }])),
          },
        },
      },
    ])
  );
}

function operation({
  tag,
  id,
  summary,
  description,
  auth = "public",
  params,
  query: querySchema,
  body: bodySchema,
  bodyExample,
  responses,
  errors = [],
}) {
  const codes = [];
  if (params || querySchema || bodySchema) codes.push("VALIDATION_ERROR");
  if (auth !== "public") codes.push("TOKEN_MISSING", "TOKEN_INVALID", "TOKEN_EXPIRED");
  if (auth === "admin") codes.push("FORBIDDEN");
  codes.push(...errors.filter((code) => !codes.includes(code)));

  const parameters = [...(params ? path(params) : []), ...(querySchema ? query(querySchema) : [])];
  const access = { public: "Público.", user: "Requiere token.", admin: "Requiere token de **admin**." }[auth];

  return {
    tags: [tag],
    operationId: id,
    summary,
    description: [access, description].filter(Boolean).join("\n\n"),
    // security: [] declara EXPLÍCITAMENTE que es público (pisa el `security` global del documento)
    security: auth === "public" ? [] : [{ bearerAuth: [] }],
    // Extensión propia (las que empiezan con x- están permitidas): qué roles pueden usarla. La usa un test.
    "x-roles": auth === "admin" ? ["admin"] : auth === "user" ? ["lector", "admin"] : [],
    ...(parameters.length > 0 && { parameters }),
    ...(bodySchema && { requestBody: body(bodySchema, { example: bodyExample }) }),
    responses: { ...responses, ...errorResponses(codes) },
  };
}

export { operation, ref, arrayOf, json };
