import { z } from "zod";
import { createBookSchema } from "../schemas/bookSchema.js";
import { lookupQuerySchema } from "../schemas/catalogSchema.js";

/**
 * Ejercicio 2 — Zod → JSON Schema, con io: "input" y io: "output" (Clase 15).
 * Ejecutar: node scripts/zodDemo.js
 *
 * ¿Qué cambia en `stock`? Con "input" es OPCIONAL (tiene .default(0): el cliente puede no mandarlo). Con "output" es
 * OBLIGATORIO (después de parsear siempre está). Además "output" agrega additionalProperties: false.
 *
 * ¿Y en `isbns`? Con "input" es un TEXTO ("978...,978..."): lo que viaja en la query. Con "output" es un ARREGLO
 * de 1 a 10 ISBN: lo que sale del transform + pipe, es decir, lo que recibe el controller.
 *
 * ¿Cuál se documenta para un pedido? "input": la documentación le dice al cliente qué MANDAR. Con "output" le
 * exigiríamos el stock y le diríamos que isbns es un arreglo, y las dos cosas serían falsas para él.
 *
 * ¿Aparece el dígito de control del ISBN? No: es un `refine` (una función), y JSON Schema solo describe formas.
 * Solo queda el `pattern` de 13 dígitos. Lo mismo con el `refine` de desde <= hasta. Por eso llevan una description.
 *
 * ¿Por qué la descripción en el esquema de Zod y no en el archivo de documentación? Porque así queda al lado de la
 * regla que describe: quien cambie el refine tiene la descripción enfrente. En otro archivo, se desfasa.
 */
const show = (title, schema, io) =>
  console.log(`\n=== ${title} (io: "${io}") ===\n`, JSON.stringify(z.toJSONSchema(schema, { io, unrepresentable: "any" }), null, 2));

show("createBookSchema", createBookSchema, "input");
show("createBookSchema", createBookSchema, "output");
show("lookupQuerySchema", lookupQuerySchema, "input");
show("lookupQuerySchema", lookupQuerySchema, "output");
