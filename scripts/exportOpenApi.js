import { writeFile } from "node:fs/promises";
import buildOpenApiSpec from "../docs/openapi.js";

/**
 * Exporta el contrato a un archivo (Clase 15): npm run docs:export [-- salida.json [url-del-servidor]]
 *
 * Sirve para lo que necesita el documento SIN el servidor corriendo:
 *  - importarlo en Postman o Insomnia (Import → File → openapi.json) y obtener la colección armada,
 *  - pasarle un linter (npx @redocly/cli lint openapi.json),
 *  - generar un cliente para el front (openapi-generator, openapi-typescript...).
 *
 * Ejercicio 10.5 — ¿Por qué openapi.json va en el .gitignore? Porque es GENERADO: la fuente de verdad es el código.
 * Versionado, se desfasaría cada vez que alguien cambia un esquema y se olvida de regenerarlo. Si el equipo decide
 * versionarlo (para ver el cambio del contrato en cada pull request), hace falta un test que compare el archivo con
 * buildOpenApiSpec() y falle si no coinciden.
 *
 * No necesita .env: buildOpenApiSpec no lee la configuración (recibe la URL del servidor por parámetro).
 * La URL se pasa como argumento y no con una variable de entorno: process.env se lee solo en config/config.js
 * (checklist de la Clase 15). Ejemplo: npm run docs:export -- openapi.json https://biblioteca.example.com
 */
const [output = "openapi.json", serverUrl = "http://localhost:8000"] = process.argv.slice(2);

const spec = buildOpenApiSpec({ serverUrl });
await writeFile(output, JSON.stringify(spec, null, 2) + "\n");

const operations = Object.values(spec.paths).flatMap((item) => Object.keys(item)).length;
console.log(`OpenAPI ${spec.openapi} → ${output} (${Object.keys(spec.paths).length} paths, ${operations} operaciones)`);
