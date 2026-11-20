# Clase 15 — Documentación de la API con OpenAPI/Swagger, README profesional y checklist de buenas prácticas

## Objetivos de la clase

- Entender **para quién** se documenta una API y distinguir los tres documentos de un proyecto: la **documentación de la API** (para quien la consume), el **README** (para quien la levanta) y los **comentarios** (para quien la mantiene).
- Conocer **OpenAPI**: qué es, en qué se diferencia de "Swagger", y cómo está armado un documento (`info`, `servers`, `paths`, `components`, `security`).
- Escribir una operación **a mano**: parámetros, cuerpo, respuestas, headers, errores con ejemplos y autenticación.
- Comparar las formas de producir la documentación (**design-first** y **code-first**) y entender el problema central: el **desfasaje** (*drift*) entre lo que dice la documentación y lo que hace el código.
- **Generar** la documentación a partir de los esquemas de **Zod** que ya validan los pedidos (`z.toJSONSchema`), y saber qué se pierde en la traducción.
- Servir la documentación con **Swagger UI** (`/docs`) y el contrato crudo (`/openapi.json`), y decidir si se publica en producción.
- Escribir **tests que mantienen viva la documentación**: que el documento sea válido, que cada ruta de Express esté documentada con el acceso correcto, y que las respuestas reales cumplan lo documentado (**tests de contrato**).
- Escribir un **README profesional** que alguien que nunca vio el proyecto pueda seguir sin preguntarte nada.
- Aplicar un **checklist de buenas prácticas** al proyecto integrador y corregir lo que aparezca.

*(Conecta con la clase 5: los verbos y status codes que hoy documentamos. Con la 6: Zod y el formato de error estandarizado, que pasan a ser parte del contrato. Con la 8 y la 9: lo que cambia según el entorno llega por parámetro, y hoy eso también vale para la documentación. Con la 11: el JWT se documenta como `securityScheme`. Con la 13: las reglas R1–R5 se le cuentan a quien consume la API. Con la 14: los tests, que hoy verifican también la documentación. Con la 16: el checklist de hoy es la guía para el simulacro de examen.)*

---

## 1. la situación: la API funciona, pero solo vos sabés usarla

La biblioteca ya tiene todo: libros, usuarios, préstamos con reglas finas, login, catálogo externo, CSV, y 118 tests que lo cuidan. Ahora alguien más la quiere usar. Puede ser una compañera que arma el **front** de la biblioteca, un equipo que hace la **app del celular**, o vos mismo dentro de seis meses. Y empiezan las preguntas por chat:

> —¿Qué le mando a `POST /loans`? ¿El `userId` va siempre?
> —¿Qué me devuelve si el socio ya tiene 3 libros? ¿Un 400? ¿Un 409? ¿Qué dice el `code`?
> —¿El token cómo va? ¿En el body? ¿En un header?
> —¿`fechaVencimiento` viene con hora?
> —¿Qué pasa si la API de feriados está caída? ¿Me da error?

Hoy cada respuesta está en un lugar distinto:

| Pregunta | Dónde está la respuesta hoy |
|---|---|
| Qué campos acepta el body | En `schemas/loanSchema.js` (hay que saber leer Zod) |
| Qué status y qué `code` devuelve cada error | Repartido en `usecases/loans/createLoan.js`, `middlewares/auth.js` y `validate.js` |
| Cómo se manda el token | En `middlewares/auth.js` |
| Qué forma tiene la respuesta | En ningún lado: hay que ejecutar el pedido y mirar |
| Qué pasa si falla un tercero | En un comentario de `calculateDueDate.js` |
| Un ejemplo que funcione | En `requests.http`, si sabés cuál de los 140 bloques mirar |

El costo es concreto: **cada pregunta te interrumpe a vos**, y cada respuesta que no está escrita la responde alguien **adivinando** (y su programa falla en producción cuando adivinó mal). Lo que falta es un **contrato**: un documento que diga, sin ambigüedad, qué acepta y qué devuelve cada endpoint.

---

## 2. tres documentos, tres lectores

Antes de escribir nada, conviene tener claro **quién lee qué**. Un proyecto profesional tiene tres tipos de documentación, y mezclarlos es el error más común:

| Documento | Lo lee... | Responde... | En la biblioteca |
|---|---|---|---|
| **Documentación de la API** | Quien la **consume** (front, app, otro backend) | ¿Qué le mando? ¿Qué me devuelve? ¿Qué errores puede haber? | `GET /docs` y `GET /openapi.json` (hoy) |
| **README** | Quien la **levanta** (alguien que clona el repo) | ¿Qué es? ¿Cómo la instalo y la corro? ¿Cómo está organizada? | `README.md` (hoy) |
| **Comentarios y tests** | Quien la **mantiene** (vos, tu equipo) | ¿Por qué está hecho así? ¿Qué regla protege esto? | Lo que venimos escribiendo desde la clase 7 |

Cada lector necesita cosas distintas. A quien consume la API **no le importa** que `createLoan` consulte los feriados después de las reglas porque es lo más caro (*fail fast*). Le importa que, si la API de feriados cae, **igual recibe un 201**, con `holidaysAvailable: false`. Y a quien mantiene el código no le sirve que el README repita los 23 endpoints: le sirve saber dónde vive cada capa.

> **Regla práctica:** la documentación de la API habla del **qué** (el comportamiento observable desde afuera). Los comentarios hablan del **por qué**. El README habla del **cómo arranco**.

---

## 3. OpenAPI: el contrato de una API REST

**OpenAPI** es un **formato estándar** para describir una API HTTP: un archivo (JSON o YAML) que lista cada endpoint con sus parámetros, sus cuerpos, sus respuestas y su forma de autenticarse. No es una librería ni un programa: es una **especificación**, como lo es JSON.

Lo valioso es que, al ser un estándar, **muchas herramientas lo entienden**:

| Herramienta | Qué hace con el documento OpenAPI |
|---|---|
| **Swagger UI**, Redoc, Scalar | Lo muestran como una página web navegable, con un botón para probar cada endpoint |
| **Postman**, Insomnia, Bruno | Lo importan y arman la colección de pedidos completa |
| Generadores de clientes (`openapi-generator`, `openapi-typescript`) | Escriben el código del cliente: el front llama a `api.createLoan({ bookId: 1 })` en lugar de armar el `fetch` |
| Linters (Spectral, Redocly) | Revisan que esté bien escrito y que siga las convenciones del equipo |
| Validadores de pedidos (`express-openapi-validator`) | Rechazan un pedido que no cumple el contrato |
| Mocks (Prism) | Levantan un servidor falso que responde según el contrato, para que el front arranque antes que el back |

### ¿Swagger u OpenAPI?

Se usan como sinónimos, pero no lo son:

- **Swagger** era el nombre de la especificación original (hasta la versión **2.0**, de 2014) y de un conjunto de herramientas de la empresa SmartBear.
- En 2016 la especificación se donó a la Linux Foundation y se renombró **OpenAPI**. La **3.0** salió en 2017 y la **3.1** en 2021. La 3.1 es la que usamos hoy: su gran cambio es que los esquemas de datos son **JSON Schema** estándar, sin dialectos propios. (En 2025 salió la 3.2, que las herramientas todavía están adoptando.)
- Hoy **"Swagger"** se refiere a las **herramientas** (Swagger UI, Swagger Editor) y **"OpenAPI"** al **formato**.

Si en un trabajo te piden "el Swagger de la API", casi siempre quieren decir "el documento OpenAPI, y una página de Swagger UI para verlo". Si ves `swagger: "2.0"` en la primera línea de un archivo, es la versión vieja: cambia bastante (no hay `components`, los cuerpos se describen distinto), y conviene no mezclar ejemplos de internet de las dos versiones.

---

## 4. anatomía de un documento OpenAPI

Así se documenta **un solo endpoint**, `GET /books/{id}`, escrito a mano en YAML:

```yaml
openapi: 3.1.0                      # versión de la ESPECIFICACIÓN (no de tu API)

info:                               # qué API es
  title: Biblioteca API
  version: 1.0.0                    # versión de TU API (del contrato)
  description: API REST de una biblioteca

servers:                            # dónde está corriendo
  - url: http://localhost:8000

paths:                              # cada URL...
  /books/{id}:                      # ...con la sintaxis de OpenAPI: {id}, no :id
    get:                            # ...y cada verbo es una "operación"
      tags: [Libros]                # para agrupar en la UI
      operationId: getBook          # nombre único (lo usan los generadores de clientes)
      summary: Obtener un libro
      parameters:
        - name: id
          in: path                  # path | query | header | cookie
          required: true            # en path, siempre true
          schema:
            type: integer
            exclusiveMinimum: 0
      responses:
        "200":                      # los status van entre comillas en YAML
          description: El libro
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Book"
        "404":
          description: No existe un libro con ese id
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
              example:
                error:
                  code: BOOK_NOT_FOUND
                  message: No existe un libro con ese id

components:                         # lo reutilizable
  schemas:
    Book:
      type: object
      required: [id, titulo, autor, isbn, stock]
      properties:
        id: { type: integer }
        titulo: { type: string, examples: ["El principito"] }
        autor: { type: string }
        isbn: { type: [string, "null"] }   # 3.1: JSON Schema estándar ("string o null")
        stock: { type: integer, minimum: 0 }
    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
```

Las piezas, de arriba hacia abajo:

| Parte | Para qué está |
|---|---|
| `openapi` | La versión de la especificación. Las herramientas la leen primero para saber cómo interpretar el resto |
| `info` | Título, versión **de tu API**, descripción. La descripción admite Markdown |
| `servers` | Las URL base. Swagger UI le pega a esta URL cuando apretás "Try it out" |
| `paths` | El corazón: cada URL, cada verbo, sus parámetros, su cuerpo (`requestBody`) y sus respuestas |
| `components` | Lo que se repite: esquemas, respuestas, parámetros y **formas de autenticarse**. Se referencia con `$ref` |
| `security` | La autenticación por defecto de todo el documento (cada operación la puede pisar) |
| `tags` | Grupos para ordenar las operaciones en la UI |

Tres detalles que confunden al principio:

- **`$ref`** es un puntero: `"#/components/schemas/Book"` significa "en este mismo documento (`#`), andá a `components` → `schemas` → `Book`". Es la forma de no repetir el esquema del libro en cada endpoint que devuelve un libro.
- **`content` va por tipo de medio:** una misma respuesta podría ofrecer `application/json` y `text/csv`. Por eso el esquema no cuelga directo de la respuesta.
- **YAML o JSON es lo mismo.** YAML es más cómodo para escribir a mano; JSON es lo que generan los programas. Hoy vamos a **generar JSON**.

---

## 5. una operación completa, a mano

`GET /books/{id}` es fácil: público, un parámetro, un error. Veamos el endpoint más complejo de la biblioteca, `POST /loans`, y todo lo que quien lo consume necesita saber:

```yaml
/loans:
  post:
    tags: [Préstamos]
    operationId: createLoan
    summary: Pedir un libro prestado
    description: |
      Un lector pide a su nombre; el admin puede indicar `userId`.
      - R1: como máximo 3 préstamos activos (`LOAN_LIMIT_REACHED`).
      - R2: vence a los 10 días hábiles. Si la API de feriados no responde,
        se presta igual y la respuesta trae `holidaysAvailable: false`.
      - R3: con algún préstamo vencido no se puede pedir otro.
    security:
      - bearerAuth: []               # exige token (ver components.securitySchemes)
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [bookId]
            properties:
              userId: { type: integer, description: "Solo admin" }
              bookId: { type: integer }
          example: { bookId: 1 }
    responses:
      "201":
        description: Préstamo creado
        headers:
          Location:                  # los headers de respuesta también se documentan
            schema: { type: string }
            description: URL del préstamo creado
        content:
          application/json:
            schema: { $ref: "#/components/schemas/Loan" }
      "400":
        description: Body inválido (VALIDATION_ERROR)
        content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      "401":
        description: Sin token, token inválido o vencido
        content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      "403":
        description: Un lector pidió a nombre de otro (FORBIDDEN)
        content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      "404":
        description: USER_NOT_FOUND o BOOK_NOT_FOUND
        content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      "409":
        description: Choca con una regla
        content:
          application/json:
            schema: { $ref: "#/components/schemas/ErrorResponse" }
            examples:                # varios ejemplos con nombre: uno por cada code posible
              LOAN_LIMIT_REACHED:
                value: { error: { code: LOAN_LIMIT_REACHED, message: "Un usuario puede tener hasta 3 préstamos activos" } }
              OUT_OF_STOCK:
                value: { error: { code: OUT_OF_STOCK, message: "No hay stock disponible de ese libro" } }
              # ... y ALREADY_LOANED, USER_HAS_OVERDUE_LOANS

components:
  securitySchemes:
    bearerAuth:                      # el nombre lo elegimos nosotros
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Fijate en lo que **sí** quedó escrito y antes había que adivinar: que `userId` es solo para el admin, que la respuesta trae un header `Location`, que un 409 puede tener **cuatro** `code` distintos (y cuál es cada uno), y que la caída de la API de feriados **no** es un error.

Y fijate también en lo que **se repite**: el 401 con sus tres códigos va igual en las 19 operaciones que exigen token; el 403 va en todas las de admin; el 400 en todas las que validan algo; el cuerpo de `ErrorResponse` en cada error. Son **más de 60 líneas** para un endpoint, y tenemos 23. Escrito a mano son más de mil líneas de YAML, separadas del código, que alguien tiene que mantener al día. Ahí aparece el problema de fondo.

---

## 6. el enemigo: el desfasaje

Imaginá que la documentación de arriba está perfecta el lunes. El martes alguien cambia el tope de préstamos para que el mensaje incluya cuántos tiene el socio. El miércoles se agrega `GET /loans/overdue`. El jueves `PUT /books/:id` pasa a ser solo para admin. Nadie toca el YAML: no se rompe nada, los tests pasan, la app anda.

Un mes después, la documentación **miente** en tres lugares. Y una documentación que miente es **peor** que ninguna: sin documentación, el que consume la API pregunta; con una documentación vieja, confía, y su programa falla.

Eso se llama **desfasaje** (en inglés, *drift*): la distancia entre lo que la documentación dice y lo que el código hace. No es un problema de disciplina ("hay que acordarse"). Es un problema de **diseño**: si la información está en dos lugares, en algún momento deja de coincidir. Es el mismo razonamiento que nos llevó a tener **un solo** Composition Root, o a que las reglas vivan **solo** en los casos de uso.

### Las formas de producir la documentación

| Enfoque | Cómo es | A favor | En contra |
|---|---|---|---|
| **Design-first** | Se escribe el OpenAPI **antes** que el código; se discute y se aprueba; después se programa | El contrato se acuerda entre front y back antes de escribir una línea. Ideal entre equipos | Hay que mantener el YAML y el código alineados, a mano o con validadores |
| **Code-first, a mano** | Se programa y después se escribe el YAML aparte | Simple, sin dependencias | El que más se desfasa: nada los une |
| **Code-first, con comentarios** (`swagger-jsdoc`) | Se escribe el YAML en un comentario arriba de cada ruta | Está cerca del código | Sigue siendo una copia: el comentario no se ejecuta, y puede decir cualquier cosa |
| **Code-first, generado** | Se **deriva** de lo que el código ya tiene: los esquemas de validación, las rutas | Lo que se genera no se puede desfasar | Hay que agregar lo que el código no sabe (descripciones, ejemplos, errores) |

**Hoy combinamos dos ideas:**

1. **Generar todo lo que se pueda** de lo que ya existe: los cuerpos y parámetros salen de los mismos esquemas de **Zod** que validan los pedidos. Si mañana `createLoanSchema` cambia, la documentación cambia sola.
2. **Testear lo que no se puede generar**: que cada ruta de Express esté documentada, que el acceso documentado (público / con token / admin) coincida con los middlewares reales, y que las respuestas reales tengan la forma documentada. Si algo se desfasa, **falla un test** (clase 14).

---

## 7. de Zod a OpenAPI

Desde la versión 4, Zod trae **`z.toJSONSchema()`**: convierte un esquema de Zod en **JSON Schema**. Y como OpenAPI 3.1 usa JSON Schema estándar, el resultado entra directo en el documento.

```js
import { z } from "zod";
import { createBookSchema } from "./schemas/bookSchema.js";

console.log(z.toJSONSchema(createBookSchema, { io: "input" }));
```

```json
{
  "type": "object",
  "properties": {
    "titulo": { "type": "string", "minLength": 1 },
    "autor":  { "type": "string", "minLength": 1 },
    "isbn":   { "type": "string", "pattern": "^\\d{13}$" },
    "stock":  { "default": 0, "type": "integer", "minimum": 0 }
  },
  "required": ["titulo", "autor"]
}
```

### `io: "input"` vs `io: "output"`

Un esquema de Zod describe **dos** formas: lo que **entra** (antes de los `default` y los `transform`) y lo que **sale** (después). En `createBookSchema`, `stock` tiene `.default(0)`:

| | `stock` | ¿Por qué? |
|---|---|---|
| `io: "input"` | **opcional** | El cliente puede no mandarlo |
| `io: "output"` | **obligatorio** | Después de parsear, siempre está (vale 0) |

Para documentar un **pedido**, lo que importa es lo que el cliente **manda**: `io: "input"`. Si usaras `"output"`, la documentación diría que `stock` es obligatorio y le harías mandar algo que no hace falta. Con `lookupQuerySchema` es aún más claro: `isbns` **entra** como texto separado por comas y **sale** como arreglo (por el `transform`). Al cliente le importa el texto.

### Lo que se pierde en la traducción

JSON Schema describe **formas**: tipos, longitudes, patrones, valores permitidos. Lo que no es una forma, **se pierde en silencio**:

| En Zod | En el JSON Schema | ¿Qué pasa? |
|---|---|---|
| `.regex(/^\d{13}$/)` | `"pattern": "^\\d{13}$"` | ✅ Se traduce |
| `.min(1)`, `.max(100)`, `.int()`, `z.enum([...])` | `minLength`, `maximum`, `integer`, `enum` | ✅ Se traduce |
| `.refine(hasValidIsbn13Checksum)` (dígito de control) | — | ❌ **Desaparece**: es una función, no una forma |
| `.refine(q => q.desde <= q.hasta)` | — | ❌ **Desaparece** |
| `.transform(...)` | Solo el tipo de entrada | ⚠️ Con `io: "input"` está bien |
| Los mensajes de error (`"El título es obligatorio"`) | — | ⚠️ No son parte del contrato |

Sin hacer nada, la documentación diría "el ISBN son 13 dígitos", y un cliente que mande `9780156012196` (13 dígitos, dígito de control inválido) recibiría un 400 que la documentación **no anunciaba**. La solución es contarlo con **`.meta()`**, que agrega datos al esquema sin cambiar cómo valida:

```js
// schemas/bookSchema.js
isbn: z
  .string()
  .regex(/^\d{13}$/, "El ISBN debe tener exactamente 13 dígitos")
  .refine(hasValidIsbn13Checksum, "El ISBN tiene un dígito de control inválido")
  // El `refine` no se puede expresar en JSON Schema: la `description` es la forma de que el cliente se entere
  .meta({ description: "ISBN-13: 13 dígitos con dígito de control válido", examples: ["9789500700122"] }),
```

`description` y `examples` aparecen en el JSON Schema, y Swagger UI los muestra al lado del campo. Lo mismo hicimos con `desde` ("no puede ser posterior a `hasta`") y con el `userId` de `POST /loans` ("solo admin").

> **La descripción va en el esquema, no en la documentación.** Así queda al lado de la regla que describe: quien cambie el `refine` la tiene enfrente.

### De un esquema a un `requestBody` y a `parameters`

Con eso armamos tres funciones chicas en `docs/zodToOpenApi.js`:

```js
// requestBody de un endpoint a partir del esquema que valida el body
function body(schema, { example } = {}) {
  return {
    required: true,
    content: { "application/json": { schema: jsonSchema(schema, { io: "input" }), ...(example && { example }) } },
  };
}

// Un esquema de objeto → una lista de `parameters` (uno por propiedad), para la query o el path
function params(schema, location) {
  const { properties = {}, required = [] } = jsonSchema(schema, { io: "input" });
  return Object.entries(properties).map(([name, { description, ...propSchema }]) => ({
    name,
    in: location,
    required: location === "path" || required.includes(name), // un parámetro de path SIEMPRE es obligatorio
    ...(description && { description }),
    schema: propSchema,
  }));
}

const query = (schema) => params(schema, "query");
const path = (schema) => params(schema, "path");
```

`jsonSchema()` llama a `z.toJSONSchema()` y limpia un poco de ruido que no le aporta nada a quien lee: el `$schema` de cada esquema, el `maximum: 9007199254740991` que agrega `.int()` (el número entero más grande de JavaScript, un límite técnico y no del negocio) y una expresión regular de 200 caracteres que acompaña a `z.iso.date()` (con `format: "date"` alcanza).

`queryLoansSchema`, por ejemplo, se convierte en cinco parámetros de query: `userId`, `bookId`, `activos`, `desde` y `hasta`, cada uno con su tipo y su descripción, sin escribir ninguno a mano.

---

## 8. no repetirse: el armador de operaciones

Con los esquemas resueltos, falta lo que **se repetía** en la sección 5: `security`, el 401, el 403, el 400, el formato de los errores. Igual que el middleware `authenticate` aplica la autenticación en un solo lugar en lugar de copiarla en cada controller, escribimos **una función** que aplica esas reglas: `operation()` en `docs/operation.js`.

```js
// docs/paths/loans.js
"/loans": {
  post: operation({
    tag: "Préstamos",
    id: "createLoan",
    summary: "Pedir un libro prestado",
    description: `Un lector pide a su nombre; el admin puede indicar \`userId\`.\n\n${RULES}`,
    auth: "user",                  // "public" | "user" | "admin"
    body: createLoanSchema,        // el MISMO esquema que usa el router para validar
    bodyExample: { bookId: 1 },
    responses: {
      201: json("Préstamo creado", ref("Loan"), {
        headers: { Location: { description: "URL del préstamo creado", schema: { type: "string" } } },
      }),
    },
    errors: ["FORBIDDEN", "USER_NOT_FOUND", "BOOK_NOT_FOUND", "ALREADY_LOANED",
             "USER_HAS_OVERDUE_LOANS", "LOAN_LIMIT_REACHED", "OUT_OF_STOCK"],
  }),
},
```

Las reglas que aplica `operation()`:

| Si la operación... | ...se agrega solo |
|---|---|
| valida `params`, `query` o `body` | `400 VALIDATION_ERROR` |
| es `auth: "user"` o `"admin"` | `security: [{ bearerAuth: [] }]` y `401` con `TOKEN_MISSING`, `TOKEN_INVALID` y `TOKEN_EXPIRED` |
| es `auth: "admin"` | `403 FORBIDDEN` |
| es `auth: "public"` | `security: []` (público **explícito**: pisa el `security` global) |
| lista `errors` | Los agrupa **por status** (los cuatro 409 van en una sola respuesta) y pone **un ejemplo con nombre por cada `code`** |

Los status y los mensajes de ejemplo salen de un **catálogo de errores** (`docs/errorCatalog.js`), uno por cada `code` que lanza la API:

```js
const ERROR_CATALOG = {
  VALIDATION_ERROR: [400, "Datos de body inválidos"],
  TOKEN_MISSING: [401, "Falta el header Authorization: Bearer <token>"],
  // ...
  LOAN_LIMIT_REACHED: [409, "Un usuario puede tener hasta 3 préstamos activos"],
  OUT_OF_STOCK: [409, "No hay stock disponible de ese libro"],
  // ...
};
```

Si una operación lista un `code` que no está en el catálogo, `operation()` **lanza un error** al armar el documento: un typo como `"LOAN_LIMIT_REACHD"` no llega a la documentación.

El resultado es OpenAPI **estándar**: no hay nada mágico, y se puede ver completo en `GET /openapi.json`. El helper solo evita escribir 60 líneas por endpoint.

### Una extensión propia: `x-roles`

OpenAPI permite agregar campos propios siempre que empiecen con **`x-`** (las herramientas los ignoran). Cada operación lleva `"x-roles"` con los roles que pueden usarla (`[]` si es pública, `["lector", "admin"]` con token, `["admin"]` solo admin). No es para Swagger UI: es para **un test** (sección 11).

### El documento entero

`docs/openapi.js` junta todo en una función:

```js
function buildOpenApiSpec({ serverUrl = "/" } = {}) {
  return {
    openapi: "3.1.0",
    info: { title: "Biblioteca API", version: "1.0.0", description: "..." },
    servers: [{ url: serverUrl }],
    tags: [/* Autenticación, Libros, Préstamos, Usuarios, Catálogo externo */],
    paths: { ...authPaths, ...booksPaths, ...loansPaths, ...usersPaths, ...catalogPaths },
    components: {
      schemas, // Book, Loan, User, ErrorResponse... (sección 10)
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
    security: [{ bearerAuth: [] }],
  };
}
```

¿Por qué una **función** y no un objeto exportado? Por lo mismo que el resto del proyecto desde la clase 8: lo que cambia según el entorno (la URL del servidor) llega **por parámetro**. `buildOpenApiSpec` no importa `config.js`, así que los tests la pueden llamar **sin `.env`**.

La `description` de `info` es un buen lugar para lo que vale para **toda** la API: cómo autenticarse, el formato de los errores ("compará el `code`, no el `message`"), y cómo vienen las fechas (instantes en UTC; días como `AAAA-MM-DD` en la zona de la biblioteca).

---

## 9. documentar es hacerse preguntas

Documentar no es solo describir. Para escribir la lista de `errors` de cada operación hay que preguntarse, endpoint por endpoint, **"¿qué puede salir mal acá?"**. Y a veces la respuesta es "no sé" o "algo que no debería".

Así pasó con `PUT /books/:id`. Al escribir sus errores: `INVALID_STOCK` (stock negativo), `BOOK_NOT_FOUND`... ¿y si mando el **ISBN de otro libro**? `POST /books` responde `409 ISBN_DUPLICATE`. Pero `updateBook` **no lo verificaba**:

| Persistencia | `PUT /books/3` con el ISBN del libro 1 |
|---|---|
| `memory` | `200 OK`: quedan **dos libros con el mismo ISBN** |
| `sequelize` | `500 INTERNAL_ERROR`: el índice único de la base lo frena, pero con un error genérico |

Ninguno de los 118 tests lo detectó, porque nadie había pensado ese caso. Lo arreglamos como en la clase 14: **primero el test** (rojo), después el código (verde):

```js
// usecases/books/updateBook.js
if (changes.isbn) {
  const owner = await dao.getByIsbn(changes.isbn);
  if (owner && owner.id !== Number(id)) {
    throw new AppError("ISBN_DUPLICATE", "Ese ISBN ya está registrado", 409);
  }
}
```

El `owner.id !== Number(id)` importa: reenviar el ISBN que el libro **ya tiene** (un formulario que manda todos los campos) no es un duplicado. Ese también es un test.

> **Una documentación de errores incompleta suele esconder un bug.** Si no sabés qué responde tu API en un caso, tu cliente tampoco lo va a saber, y probablemente tu código tampoco lo haya pensado.

---

## 10. las respuestas también tienen contrato

Los esquemas de `schemas/` describen lo que **entra**. Para lo que **sale** (un libro, un préstamo, el informe de importación) no había nada: los casos de uso devuelven objetos y listo. Los escribimos en `docs/responseSchemas.js`, **también con Zod**:

```js
const Loan = z.strictObject({
  id,
  userId: id,
  bookId: id,
  fechaPrestamo: instant,              // z.iso.datetime(): "2026-11-04T15:00:00.000Z"
  fechaVencimiento: day,               // z.iso.date(): "2026-11-19"
  fechaDevolucion: instant.nullable(),
  renovaciones: z.number().int().min(0),
  usuario: z.strictObject({ id, nombre: z.string() }).nullable(),
  libro: z.strictObject({ id, titulo: z.string() }).nullable(),
  estado: z.enum(["activo", "vencido", "devuelto"]).meta({ description: "Calculado, no guardado" }),
  diasAtraso: z.number().int().min(0),
  holidaysAvailable: z.boolean().optional().meta({ description: "Solo al prestar o renovar..." }),
});

// Sin passwordHash: nunca sale de la API
const User = z.strictObject({ id, nombre: z.string(), email: z.email(), rol: z.enum(["lector", "admin"]) });
```

¿Por qué Zod, si no vamos a validar las respuestas en el servidor? Por dos motivos:

1. Se convierten a JSON Schema con **la misma función** que los de entrada, y entran en `components.schemas`.
2. **Se pueden ejecutar.** Un esquema de Zod no es solo un dibujo: es un programa que dice "esto cumple" o "esto no cumple". Eso permite escribir **tests de contrato**.

### Tests de contrato

Un test de contrato ejecuta el caso de uso **de verdad** y verifica que lo que devuelve cumple lo documentado:

```js
// tests/contract/responses.test.js
const wire = (value) => JSON.parse(JSON.stringify(value)); // lo mismo que hace res.json()

function expectToMatchContract(schema, value) {
  const result = schema.safeParse(wire(value));
  expect(result.success, result.error && JSON.stringify(result.error.issues, null, 2)).toBe(true);
}

it("POST /loans devuelve un Loan (con holidaysAvailable)", async () => {
  const loan = await scenario.useCases.createLoan({ bookId: 1 }, ANA);
  expectToMatchContract(R.Loan, loan);
});
```

Dos decisiones que importan:

- **`wire()`**: no se valida el objeto que devuelve el caso de uso, sino **lo que viaja por la red**. `fechaPrestamo` es un `Date` en JavaScript, pero `res.json()` lo convierte en texto ISO. El cliente recibe texto, y eso es lo que se documenta.
- **`z.strictObject`**: un campo que **no está documentado** hace fallar el test. Si un día `passwordHash` se filtra en la respuesta de un usuario, nos enteramos en el test y no en un incidente de seguridad.

### El test encontró algo

La primera vez que corrimos el test de contrato de `PUT /loans/:id/return`, falló:

```
AssertionError: [
  { "code": "unrecognized_keys", "keys": ["atrasoAlDevolver"], "message": "Unrecognized key: \"atrasoAlDevolver\"" }
]
```

`returnLoan` devuelve un campo, `atrasoAlDevolver` (con cuántos días de atraso se devolvió), que la clase 13 agregó y que **nadie había documentado**. Exactamente lo que el test tiene que atrapar. Lo agregamos al esquema `Loan` con su descripción, y el test pasó.

> **Un test de contrato no prueba reglas de negocio** (eso ya lo hacen los de la clase 14). Prueba que **la documentación dice la verdad** sobre la forma de las respuestas.

---

## 11. la documentación que se verifica sola

Lo generado desde Zod no se puede desfasar. Pero hay cosas que el documento dice y que **no** salen de Zod: qué rutas existen y quién puede usarlas. Para eso, `tests/docs/openapi.test.js`.

### 1. El documento es OpenAPI válido

```js
import SwaggerParser from "@apidevtools/swagger-parser";

it("es un documento OpenAPI 3.1 válido", async () => {
  // validate() modifica el objeto (resuelve los $ref): se le pasa una copia
  await expect(SwaggerParser.validate(structuredClone(spec))).resolves.toBeDefined();
});
```

Un `$ref` a un esquema que no existe, un parámetro de path sin `required: true`, un status inválido: Swagger UI muestra un error, Postman no importa, y el generador de clientes se niega. Mejor enterarse en el test.

### 2. Cada ruta de Express está documentada (y al revés)

Express guarda las rutas de cada router en `router.stack`. Construimos los routers con un controlador y unos middlewares **falsos** (dobles, como en la clase 14) y leemos esa lista:

```js
// Middlewares reconocibles: el test sabe cuál es cuál
function authenticate(req, res, next) { next(); }
const authorize = (...roles) => Object.assign((req, res, next) => next(), { roles });
const anyController = new Proxy({}, { get: () => (req, res) => res.end() }); // responde a cualquier método

const MOUNTS = [
  ["/books", createBooksRouter(anyController, { authenticate, authorize })],
  ["/loans", createLoansRouter(anyController, { authenticate, authorize })],
  // ...
];

// "/books" + "/:id/details" → "GET /books/{id}/details", con su acceso: "public" | "user" | "admin"
function expressRoutes() {
  return MOUNTS.flatMap(([prefix, router]) =>
    router.stack.filter((layer) => layer.route).flatMap((layer) => {
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
```

Con las dos listas (rutas reales y operaciones documentadas) los tests son una resta:

```js
it("cada ruta de Express está documentada", () => {
  const missing = routes.map((r) => r.key).filter((key) => !documentedKeys.includes(key));
  expect(missing, "Rutas sin documentar").toEqual([]);
});
```

### 3. El acceso documentado coincide con el real

Acá entra `x-roles`. Si el router de `GET /loans/:id` tiene `authenticate` pero la documentación dice que es solo admin (o al revés, si alguien saca el `authorize("admin")` de una ruta y la documentación sigue diciendo "solo admin"), falla:

```
× GET /loans/{id}: el acceso documentado es 'user', igual que en el router
AssertionError: expected 'admin' to be 'user'
```

### Verlo en rojo

Como aprendimos en la clase 14 (sección 15.10), antes de confiar en estos tests hay que **romper algo a propósito**. Agregamos `router.get("/stats", controller.list)` en `booksRoutes.js` sin documentarla, y cambiamos el `auth` de `getLoan` a `"admin"`:

```
× cada ruta de Express está documentada
  AssertionError: Rutas sin documentar: expected [ 'GET /books/stats' ] to deeply equal []
× GET /loans/{id}: el acceso documentado es 'user', igual que en el router
```

Y un detalle de la clase 14: si `expressRoutes()` tuviera un bug y devolviera `[]`, "cada ruta está documentada" pasaría **en verde sin verificar nada**. Por eso el archivo empieza verificando que encontró más de 20 rutas.

### Otra vez: si cuesta testearlo, está acoplado

Para construir el router de autenticación en el test, hubo que importar `routes/authRoutes.js`, que importaba `LOGIN_RATE_LIMIT_MAX` de `config.js`... que exige `JWT_SECRET`. **El mismo problema de la clase 14** (sección 12), en otra capa. La solución, la misma: el límite llega **por parámetro**.

```js
// routes/authRoutes.js
function createAuthRouter(controller, { authenticate }, { loginRateLimitMax = 5 } = {}) { ... }

// container/container.js
router.use("/auth", createAuthRouter(authController, auth, { loginRateLimitMax: LOGIN_RATE_LIMIT_MAX }));
```

---

## 12. Swagger UI: la documentación para personas

`/openapi.json` es para **máquinas**. Para **personas**, servimos el mismo documento con **Swagger UI**, usando el paquete `swagger-ui-express`:

```js
// routes/docsRoutes.js
import express from "express";
import swaggerUi from "swagger-ui-express";

function createDocsRouter(spec) {
  const router = express.Router();

  router.get("/openapi.json", (req, res) => res.json(spec));

  router.use(
    "/docs",
    swaggerUi.serve,                 // los archivos estáticos (JS y CSS de la página)
    swaggerUi.setup(spec, {
      customSiteTitle: "Biblioteca API — Docs",
      swaggerOptions: {
        persistAuthorization: true,  // el token pegado en "Authorize" sobrevive a un F5
        displayRequestDuration: true,
      },
    })
  );

  return router;
}
```

Como siempre, el router **recibe** el documento armado: no decide qué se documenta, solo cómo se sirve. Y el contenedor lo monta:

```js
// container/container.js
if (DOCS_ENABLED) {
  router.use(createDocsRouter(buildOpenApiSpec()));
}
```

### Usarla

1. Abrí `http://localhost:8000/docs`.
2. Desplegá `POST /auth/login`, tocá **Try it out**, ejecutalo con el admin.
3. Copiá el `token` de la respuesta, tocá **Authorize** (arriba a la derecha) y pegalo **sin** la palabra `Bearer` (Swagger UI la agrega).
4. Ahora cualquier endpoint protegido manda el header `Authorization`. Swagger UI muestra además el `curl` equivalente de cada pedido.

> **"Try it out" no es un simulador.** Le pega al servidor de verdad: un `DELETE /books/1` desde Swagger UI borra el libro 1. Contra un servidor de producción, es producción.

### ¿Se publica en producción?

| A favor de publicarla | En contra |
|---|---|
| Si la API es **pública** (otros la integran), la documentación es parte del producto | En una API **interna**, le das el mapa completo a cualquiera que llegue a la URL |
| Es la forma más rápida de que alguien de otro equipo la entienda | "Try it out" contra producción es un riesgo operativo |

Importante: **ocultar la documentación no es seguridad.** Si un endpoint está mal protegido, está mal protegido con o sin Swagger: un atacante prueba URLs igual (eso se llama *security through obscurity* y no funciona). Lo que la documentación cambia es cuánto le cuesta a alguien encontrar el problema.

Nosotros elegimos un término medio configurable: **`DOCS_ENABLED`**, encendida por defecto en desarrollo y apagada en producción si no se define.

```js
// config/config.js
const DOCS_ENABLED = (process.env.DOCS_ENABLED ?? (NODE_ENV === "production" ? "false" : "true")) === "true";
```

Las alternativas que vas a ver en el trabajo: publicarla detrás de autenticación, publicarla en un sitio aparte (generado desde `openapi.json`), o publicar solo `/openapi.json` en un portal interno de APIs.

---

## 13. de OpenAPI a la colección de pruebas

### Postman, Insomnia, Bruno

Como el documento es estándar, no hace falta armar la colección de Postman a mano: se **importa**. Para eso no hace falta ni levantar el servidor:

```bash
npm run docs:export        # escribe openapi.json (scripts/exportOpenApi.js)
```

En Postman: **Import → File → `openapi.json`**. Aparece una carpeta por tag (Libros, Préstamos...), un pedido por operación, con los parámetros y los cuerpos de ejemplo ya cargados. Y con **Newman** (el runner de Postman por consola) esa colección se puede correr en un pipeline.

`openapi.json` está en el `.gitignore`: es un archivo **generado**, y la fuente de verdad es el código. (Algunos equipos sí lo versionan, para que en cada *pull request* se vea el cambio del contrato. Si lo hacés, sumá un test que verifique que el archivo versionado coincide con el generado: si no, se desfasa.)

### El `.http` también se profesionaliza

`requests.http` tenía `http://localhost:8000` escrito **134 veces**. Si mañana el puerto es otro, o querés probar contra un servidor desplegado, hay que reemplazar en todo el archivo. REST Client admite variables de archivo:

```http
@baseUrl = http://localhost:8000

### 1. Obtener todos los libros
GET {{baseUrl}}/books
```

Es el mismo principio que `config.js`: **un valor que cambia según el entorno se define en un solo lugar**. (En Postman, lo mismo se hace con *environments*.)

---

## 14. el README profesional

El README es lo **primero** que ve alguien que llega al repositorio: un compañero, quien te corrige, alguien que te quiere contratar y mira tu GitHub. Su lector es **una persona que nunca vio el proyecto y lo quiere levantar**. Tiene cinco minutos de paciencia.

### Las secciones

| Sección | Responde | Error típico |
|---|---|---|
| **Qué es** (1–3 líneas) | ¿Qué problema resuelve? | Empezar por la tecnología ("API en Express con Sequelize...") en lugar del problema |
| **Requisitos** | ¿Qué tengo que tener instalado? ¿Qué versión? | Omitir la versión de Node, y que falle con un error críptico |
| **Puesta en marcha** | Los comandos, **en orden**, para que funcione | Saltear el `cp .env.example .env` "porque es obvio" |
| **Variables de entorno** | Qué significa cada una, su valor por defecto, cuáles son obligatorias | Una lista de nombres sin explicación |
| **Scripts** | Qué hace cada `npm run` | — |
| **Uso / Endpoints** | Un resumen, y **dónde está el detalle** (`/docs`) | Copiar los 23 endpoints con todos sus campos: se desfasa |
| **Arquitectura** | Cómo está organizado y por qué | Pegar el árbol de carpetas sin decir qué es cada una |
| **Tests** | Cómo se corren y qué cubren | — |
| **Limitaciones conocidas** | Qué **no** hace bien, a sabiendas | Omitirlas: parece que no las viste |
| **Problemas frecuentes** | Síntoma → causa → solución | — |

El README de la biblioteca (`README.md`) sigue esa estructura. Algunas decisiones:

- **El primer pedido está explicado**, paso a paso: login con el admin, copiar el token, Authorize. Es lo que más tiempo hace perder a alguien nuevo.
- **La tabla de variables de entorno** tiene las 28, con su valor por defecto y para qué sirven. Es la sección que más se consulta después de la instalación.
- **Los endpoints van resumidos** en una tabla por recurso, con un enlace a `/docs` para el detalle. El README no compite con Swagger: lo presenta.
- **La arquitectura tiene un diagrama** en Mermaid (GitHub lo dibuja solo) y, sobre todo, **las decisiones** que alguien tiene que conocer antes de tocar el código: "los casos de uso no leen `process.env` ni llaman a `new Date()`".
- **Las limitaciones son honestas**: el token vale hasta que vence aunque borres al usuario, la condición de carrera del tope de préstamos, el rate limit en memoria. Escribirlas muestra que las pensaste; esconderlas, que no las viste.

### La prueba del compañero

Un README se prueba como el código: **ejecutándolo**. Pedile a alguien (o hacelo vos, en una carpeta nueva) que **clone el repositorio y siga solo el README**, sin preguntarte nada. Cada vez que se traba, falta algo. Los clásicos:

- `Falta la variable de entorno JWT_SECRET`: el README no decía que había que copiar el `.env`.
- `npm ERR! engine`: la versión de Node no estaba en los requisitos (para eso está `"engines"` en `package.json`).
- "¿Cuál es la contraseña del admin?": estaba en el `.env.example`, pero el README no lo decía.
- Un comando que funciona en Linux y no en Windows (`cp`), sin la alternativa.

---

## 15. checklist de buenas prácticas

Durante 15 clases fuimos sumando decisiones. Este checklist las junta en preguntas que se pueden **verificar**: cada ítem tiene una forma concreta de comprobarlo, no un "más o menos". Es también la guía para el simulacro de la clase 16 y para el final.

### Arquitectura

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Los controllers solo traducen HTTP ↔ caso de uso (sin reglas de negocio)? | Ningún `if` de negocio en `controllers/` |
| ☐ | ¿Los casos de uso no conocen Express (`req`, `res`, status HTTP)? | `grep -rnE "\b(req\|res)\." usecases/` no encuentra nada |
| ☐ | ¿Los casos de uso no leen `process.env`, no llaman a `new Date()` ni a `fetch`? | `grep -rn "process.env\|new Date()\|fetch(" usecases/ domain/` solo encuentra comentarios |
| ☐ | ¿Todas las dependencias se arman en **un solo** lugar (Composition Root)? | Solo `container/` hace `new` de DAOs, gateways y servicios |
| ☐ | ¿La persistencia se puede cambiar sin tocar los casos de uso? | Correr con `PERSISTENCE_TYPE=memory` y `sequelize` |

### REST y HTTP

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Las URL son sustantivos en plural y los verbos HTTP dicen la acción? | `/loans`, no `/getLoans` ni `/createLoan` |
| ☐ | ¿Crear responde `201` (con `Location` si aplica) y borrar `204` sin cuerpo? | Probar en el `.http` |
| ☐ | ¿Cada error tiene el status correcto? (`400` forma, `401` quién sos, `403` permiso, `404` no existe, `409` choca con el estado o una regla, `5xx` falla nuestra o de un tercero) | La tabla de la clase 13 |
| ☐ | ¿Una ruta inexistente responde `404` con el formato estándar (no el HTML de Express)? | `GET /noexiste` |

### Validación y errores

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Todo lo que entra (body, query, params) se valida **antes** del caso de uso? | Cada ruta con body/query/params tiene `validate(...)` |
| ☐ | ¿Todos los errores tienen el **mismo formato** (`{ error: { code, message, details? } }`)? | Provocar un 400, un 404, un 409 y un 500 |
| ☐ | ¿Un error inesperado responde `500` genérico, **sin** stack trace ni detalles internos? | Forzar un `TypeError` y mirar la respuesta |
| ☐ | ¿Las reglas de negocio están en el caso de uso, no en el esquema de Zod? | Zod: forma. Caso de uso: reglas que consultan datos |

### Seguridad

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Las contraseñas se guardan hasheadas (bcrypt) y **nunca** salen en una respuesta? | El test de contrato con `z.strictObject` |
| ☐ | ¿El secreto del JWT no tiene valor por defecto y no está en el repositorio? | `config.js` falla sin `JWT_SECRET`; `.env` en `.gitignore` |
| ☐ | ¿Cada endpoint de escritura está protegido, y los permisos por **dueño** se verifican en el caso de uso? | El test de acceso de `tests/docs/` |
| ☐ | ¿El login da el **mismo** error si el email no existe o la contraseña es incorrecta? | Test de `loginUser` (clase 14) |
| ☐ | ¿Hay un límite de intentos fallidos de login? | 6 logins fallidos seguidos → `429` |

### Configuración y repositorio

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿`process.env` se lee en **un solo** archivo? | `grep -rn "process.env" --include=*.js . \| grep -v node_modules`: fuera de `config/config.js`, solo comentarios |
| ☐ | ¿Hay un `.env.example` con **todas** las variables y ningún secreto real? | Compararlo con `config.js` |
| ☐ | ¿`.gitignore` excluye `node_modules/`, `.env`, la base local, logs y `coverage/`? | `git status` en un proyecto recién usado |
| ☐ | ¿Está el `package-lock.json` versionado? | Sin él, `npm install` puede instalar otras versiones |
| ☐ | ¿Las herramientas de desarrollo (Vitest, supertest) están en `devDependencies`? | `package.json` |
| ☐ | ¿`package.json` declara la versión de Node (`"engines"`)? | `package.json` |

### Integraciones externas

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Cada API externa está detrás de un gateway inyectado, con una versión falsa? | `CATALOG_TYPE=fake` funciona sin internet |
| ☐ | ¿Cada pedido externo tiene **timeout**? | `EXTERNAL_TIMEOUT_MS` |
| ☐ | ¿Si un tercero cae, lo que no depende de él sigue funcionando (degradación elegante)? | `HOLIDAYS_TYPE=fake-down` → igual se presta |

### Tests

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿`npm test` corre sin `.env`, sin base y sin red? | Correrlo en un clon limpio, sin `.env` |
| ☐ | ¿Cada regla de negocio tiene su caso feliz, su borde, su violación y "el estado no cambió"? | Leer los nombres de los tests |
| ☐ | ¿Los tests detectan bugs? | Romper el código a propósito (clase 14, sección 14) |

### Documentación

| ✔ | Pregunta | Cómo verificarlo |
|---|---|---|
| ☐ | ¿Cada endpoint está documentado con sus parámetros, su cuerpo, sus respuestas y **cada `code` de error** posible? | `/docs` + el test de rutas |
| ☐ | ¿La documentación se genera del código o se verifica con tests (no depende de "acordarse")? | `tests/docs/`, `tests/contract/` |
| ☐ | ¿El README permite levantar el proyecto sin preguntarle nada a nadie? | La prueba del compañero |
| ☐ | ¿Las limitaciones conocidas están escritas? | README |

### Aplicándolo a la biblioteca

Pasamos el checklist por el proyecto, y aparecieron cosas:

| Ítem | Hallazgo | Qué hicimos |
|---|---|---|
| Casos de uso sin `new Date()` | `exportBooksCsv` armaba el nombre del archivo con `new Date().toISOString()`. Además de romper la regla, era un **bug**: `toISOString()` da la fecha en **UTC**, así que un CSV exportado a las 22:30 en Buenos Aires salía con la fecha de **mañana** | Test primero (reloj fijo a las 22:30 → `libros-2026-11-04.csv`), y después inyectar `clock` en `makeBookUseCases` y usar `clock.today()` |
| Cada `code` de error documentado | `PUT /books/:id` no verificaba el ISBN duplicado (sección 9) | Test + arreglo en `updateBook` |
| Respuestas documentadas | `atrasoAlDevolver` no estaba documentado (sección 10) | Agregado al esquema `Loan` |
| `"engines"` en `package.json` | Faltaba | Agregado: `"node": ">=22"` |
| `process.env` en un solo lugar | `notifications/fileNotifier.js` leía `process.env.NOTIFICATIONS_LOG_PATH` por su cuenta. Era una variable **fantasma**: funcionaba, pero no estaba en `config.js`, ni en `.env.example`, ni en el README | Pasa a `config.js`, y se suma a `.env.example` y a la tabla del README |
| `process.env` en un solo lugar | El script nuevo de exportación (`scripts/exportOpenApi.js`) leía `process.env.PUBLIC_URL`: se nos coló hoy mismo | La URL pasa a ser un argumento: `npm run docs:export -- openapi.json https://mi-servidor` |
| Valores que cambian según el entorno, en un solo lugar | `requests.http` repetía la URL 134 veces | Variable `@baseUrl` |
| Condición de carrera del tope de préstamos (R1) | Conocida desde la clase 13 | No se arregla hoy: queda escrita en **Limitaciones conocidas** del README |

Lo de `exportBooksCsv` es el ejemplo perfecto de para qué sirve un checklist: la regla "los casos de uso no llaman a `new Date()`" la escribimos en la clase 13, y se nos escapó en un caso de uso de la clase 12 que **nadie volvió a mirar**. Un checklist no es para el código nuevo, es para **revisar todo** cada tanto.

---

## 16. documentar con un agente de IA

Un agente de IA escribe un OpenAPI de 1500 líneas en un minuto, y un README en diez segundos. El problema no es la velocidad, es la **confianza**: los errores típicos de una documentación generada por IA son justo los que más daño hacen, porque se ven bien.

| Lo que suele hacer un agente | Por qué es grave |
|---|---|
| Inventa campos "razonables" que no existen (`createdAt`, `updatedAt`) | El cliente los espera y no llegan |
| Pone el status "de manual" en lugar del real (`400` donde la API responde `409`) | El cliente maneja el error equivocado |
| Documenta los errores genéricos y omite los de negocio (`USER_HAS_OVERDUE_LOANS`) | Justo los que el cliente más necesita conocer |
| Copia ejemplos de Swagger 2.0 en un documento 3.1 | El documento no valida |
| En el README, escribe comandos que nunca ejecutó | "Instalación" que no instala |

Lo que hicimos hoy es, en el fondo, un **arnés** para cualquier documentación, la escriba quien la escriba (clase 14, sección 16):

- El **test de contrato** atrapa los campos inventados u omitidos.
- El **test de rutas** atrapa los endpoints inventados u olvidados, y los permisos equivocados.
- **`swagger-parser`** atrapa el documento inválido.
- La **prueba del compañero** atrapa el README que no funciona: cada comando se ejecuta, en un clon limpio.

Con ese arnés, un pedido razonable a un agente es: *"Agregá la descripción y los ejemplos de las operaciones de `docs/paths/users.js`. No cambies los esquemas ni las rutas. Terminaste cuando `npm test` pasa."* Lo que no se puede verificar con un comando (¿la descripción es clara? ¿el `code` listado es realmente el que lanza ese caso de uso?) lo revisás vos.

---

## 17. errores comunes

| Error | Consecuencia | Qué hacemos |
|---|---|---|
| Documentar a mano, aparte del código, sin ningún test | La documentación se desfasa en semanas y empieza a mentir | Generar de los esquemas + tests de rutas y de contrato |
| Usar `io: "output"` para documentar un pedido | Los campos con `default` aparecen como obligatorios | `io: "input"` para lo que entra |
| Confiar en que el `refine` "se documenta solo" | Un 400 que la documentación no anunciaba | `.meta({ description })` en el campo |
| Documentar solo el caso feliz (`200`) | El cliente no sabe qué errores manejar | Cada `code` posible, con un ejemplo |
| Comparar el `message` en el cliente | Se rompe al corregir una tilde | Documentar que lo estable es el `code` |
| Olvidar `security: []` en las operaciones públicas | Con un `security` global, la UI pide token para el login | Público **explícito** |
| Escribir `:id` en lugar de `{id}` en los paths | El documento no valida, o Swagger UI no reemplaza el parámetro | Sintaxis de OpenAPI: `{id}` |
| Esquemas de respuesta "abiertos" | Un `passwordHash` filtrado pasa desapercibido | `z.strictObject` en el contrato |
| Validar el objeto del caso de uso y no lo serializado | Un `Date` no es un `string`: el test falla, o miente | `JSON.parse(JSON.stringify(...))` |
| Publicar Swagger en producción sin pensarlo, o creer que ocultarlo es seguridad | Mapa completo para cualquiera / falsa sensación de seguridad | `DOCS_ENABLED` + proteger bien cada endpoint |
| Un README que repite los 23 endpoints con todos sus campos | Dos documentaciones que se desfasan entre sí | Resumen + enlace a `/docs` |
| Un README que nadie probó en un clon limpio | El primer comando falla | La prueba del compañero |
| Esconder las limitaciones | Parece que no las viste | Una sección de limitaciones conocidas |

---

## 18. lo que NO vimos (y que existe)

- **Design-first con linters**: escribir el OpenAPI primero y controlarlo con **Spectral** o **Redocly CLI** (`npx @redocly/cli lint openapi.json`), con reglas propias del equipo ("todo `operationId` en camelCase", "toda operación con al menos un 4xx").
- **Librerías que hacen el puente Zod → OpenAPI** más completo: `@asteasolutions/zod-to-openapi` o `zod-openapi`, que registran las rutas junto con los esquemas. Y frameworks que lo traen integrado: **NestJS** (`@nestjs/swagger`), Fastify, Hono, tsoa.
- **Un catálogo de errores que el código use**: hoy `errorCatalog.js` es una copia de lo que lanzan los casos de uso. Si los casos de uso importaran los códigos de ese catálogo (`throw appError(ERRORS.LOAN_LIMIT_REACHED)`), un código nuevo no se podría olvidar en la documentación.
- **Validar contra el contrato en tiempo de ejecución** (`express-openapi-validator`): el servidor rechaza los pedidos que no cumplen el documento, y en desarrollo también verifica las respuestas.
- **Generación de clientes** (`openapi-typescript`, `orval`, `openapi-generator`): el front recibe funciones tipadas generadas del contrato, y si el back cambia un campo, el front deja de compilar.
- **Mocks desde el contrato** (Prism): un servidor falso que responde según el documento, para que el front arranque antes que el back.
- **Versionado de la API**: qué es un cambio que rompe a los clientes (*breaking change*), versiones en la URL (`/v1/loans`), `deprecated: true` en una operación, y un **CHANGELOG** con versionado semántico.
- **AsyncAPI**: el equivalente de OpenAPI para APIs basadas en **eventos y mensajes** (como nuestro `book.lowStock`, si saliera por una cola).
- **ADR** (*Architecture Decision Records*): un archivo corto por cada decisión importante ("por qué Zod y no class-validator"), con el contexto y las alternativas descartadas.
- **Otras UI para el mismo documento**: Redoc (solo lectura, muy prolija) y Scalar (más moderna, con cliente integrado).

---

## Cierre

- Hay **tres documentos y tres lectores**: la documentación de la API (quien la consume), el README (quien la levanta) y los comentarios y tests (quien la mantiene).
- **OpenAPI** es el formato estándar para describir una API REST; **Swagger** son las herramientas. Al ser estándar, el mismo documento sirve para Swagger UI, Postman, generadores de clientes y linters.
- Un documento OpenAPI tiene `info`, `servers`, `paths` (con sus operaciones), `components` (lo reutilizable, con `$ref`) y `security`.
- El enemigo es el **desfasaje**: una documentación que miente es peor que ninguna. Se combate **generando** lo que se pueda y **testeando** el resto.
- Los esquemas de **Zod** que validan los pedidos generan la documentación con `z.toJSONSchema` (`io: "input"`). Lo que JSON Schema no expresa (`refine`) se cuenta con `.meta({ description })`.
- Un helper aplica en un solo lugar lo que se repite (seguridad, 400, 401, 403, formato de error), y cada operación lista **cada `code`** que puede devolver.
- **Documentar es hacerse preguntas**: al listar los errores de `PUT /books/:id` apareció un bug.
- Los **tests de contrato** verifican que las respuestas reales cumplen lo documentado (y encontraron `atrasoAlDevolver`); los **tests de rutas** verifican que cada ruta está documentada con el acceso correcto.
- **Swagger UI** (`/docs`) es para personas; `/openapi.json`, para máquinas. Publicarla en producción es una decisión, y ocultarla **no** es seguridad.
- El **README** se escribe para alguien que nunca vio el proyecto, y se prueba siguiéndolo en un clon limpio.
- El **checklist** convierte 15 clases de decisiones en preguntas verificables, y aplicado a la biblioteca encontró un `new Date()` que además era un bug de zona horaria.

La próxima clase (16) es el **simulacro de examen**: un enunciado nuevo, con tiempo acotado. El checklist de hoy es la mejor guía para repasar: si tu proyecto lo cumple, sabés hacer todo lo que se va a pedir.
