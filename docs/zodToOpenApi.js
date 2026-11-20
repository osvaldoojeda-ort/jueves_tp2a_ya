import { z } from "zod";

/**
 * Puente Zod → OpenAPI (Clase 15).
 *
 * Los esquemas de Zod que ya validan cada pedido (Clase 6) son la ÚNICA fuente de verdad de la forma de los datos.
 * En lugar de copiarlos a mano en la documentación (y que algún día dejen de coincidir), se TRADUCEN con
 * `z.toJSONSchema()`, que viene con Zod 4. OpenAPI 3.1 usa JSON Schema tal cual, así que el resultado entra directo.
 *
 * Dos detalles que conviene entender:
 *  - `io: "input"` describe lo que el cliente MANDA (antes de los `default` y `transform`). Por ejemplo, en
 *    POST /books el `stock` tiene default 0: para el cliente es OPCIONAL. Con `io: "output"` saldría obligatorio.
 *  - Lo que JSON Schema no puede expresar se pierde en silencio: un `refine` (el dígito de control del ISBN, el
 *    "desde <= hasta") NO aparece en el resultado. Por eso esos campos llevan una `description` con `.meta()`.
 */

// Ruido que agrega la conversión y que no le aporta nada a quien lee la documentación
function clean(node) {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue; // el documento OpenAPI ya declara su dialecto
    if (key === "maximum" && value === Number.MAX_SAFE_INTEGER) continue; // límite técnico de .int(), no del negocio
    if (key === "minimum" && value === Number.MIN_SAFE_INTEGER) continue;
    if (key === "pattern" && node.format === "date") continue; // la regex de z.iso.date() es ilegible; "format: date" alcanza
    out[key] = clean(value);
  }
  return out;
}

// JSON Schema (sin ruido) de un esquema de Zod
function jsonSchema(schema, { io = "output" } = {}) {
  return clean(z.toJSONSchema(schema, { io, unrepresentable: "any" }));
}

// requestBody de un endpoint a partir del esquema que valida el body
function body(schema, { description, example } = {}) {
  return {
    required: true,
    ...(description && { description }),
    content: {
      "application/json": {
        schema: jsonSchema(schema, { io: "input" }),
        ...(example && { example }),
      },
    },
  };
}

// Un esquema de objeto de Zod → una lista de `parameters` (uno por propiedad), para la query o el path
function params(schema, location) {
  const { properties = {}, required = [] } = jsonSchema(schema, { io: "input" });
  return Object.entries(properties).map(([name, { description, ...propSchema }]) => ({
    name,
    in: location,
    required: location === "path" || required.includes(name), // en OpenAPI un parámetro de path SIEMPRE es obligatorio
    ...(description && { description }),
    schema: propSchema,
  }));
}

const query = (schema) => params(schema, "query");
const path = (schema) => params(schema, "path");

export { jsonSchema, body, query, path };
