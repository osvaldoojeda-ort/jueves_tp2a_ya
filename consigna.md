# Clase 15 — Consigna de Práctica (Tarea Integradora)

En esta clase viste **para quién** se documenta una API, cómo está armado un documento **OpenAPI**, cómo **generarlo** a partir de los esquemas de **Zod** que ya validan los pedidos (`z.toJSONSchema`), cómo servirlo con **Swagger UI**, cómo escribir **tests que impiden que la documentación se desfase** (rutas, permisos y forma de las respuestas), cómo escribir un **README profesional** y cómo aplicar un **checklist de buenas prácticas**.

Hoy la biblioteca funciona y está testeada, pero solo vos sabés usarla: para saber qué mandar a `POST /loans` o qué `code` devuelve cuando el socio ya tiene 3 libros, hay que leer el código. El objetivo es que **cualquiera pueda usar la API y levantar el proyecto sin preguntarte nada**, y que esa documentación **no pueda quedar vieja sin que falle un test**. Respetando la arquitectura de siempre: la documentación no lee `process.env` (recibe lo que necesita por parámetro), el router de documentación no decide qué se documenta, y los tests corren sin `.env`.

> **Antes de empezar:** copia el proyecto de la clase 14 y ejecuta `npm install`. Verifica que `npm test` pase antes de tocar nada: los 118 tests de la clase anterior son tu red de seguridad para los arreglos de los ejercicios 9 y 12.

---

## Tarea Integrada: Documentación, README y checklist

Sigue estos pasos en orden:

### Ejercicio 1: Instalación y un documento a mano
1. Instala `swagger-ui-express` como dependencia, y `@apidevtools/swagger-parser` y `supertest` como dependencias de desarrollo.
2. Antes de generar nada, escribe **a mano** en `docs/manual.yaml` un documento OpenAPI 3.1 con dos operaciones:
   - `GET /books/{id}`: parámetro de path, respuesta `200` con un `$ref` a `#/components/schemas/Book`, y `404` con un ejemplo de `BOOK_NOT_FOUND`.
   - `POST /auth/login`: `requestBody` con `email` y `password`, `200` con `token` y `user`, y `401 INVALID_CREDENTIALS`. Debe declarar `security: []`.
   - Define `Book`, `ErrorResponse` y el `securityScheme` `bearerAuth` (tipo `http`, esquema `bearer`, formato `JWT`) en `components`, y un `security` global.
3. Pega el archivo en [editor.swagger.io](https://editor.swagger.io) y corrige los errores que marque hasta que quede limpio.
4. Preguntas para reflexionar (respóndelas en un comentario al inicio del YAML):
   - ¿Qué diferencia hay entre el `openapi: 3.1.0` y el `version` de `info`?
   - ¿Por qué el path es `/books/{id}` y no `/books/:id`?
   - ¿Qué pasaría con el login si te olvidaras del `security: []`, teniendo un `security` global?

### Ejercicio 2: De Zod a JSON Schema
1. Crea `docs/zodToOpenApi.js` con:
   - `jsonSchema(schema, { io })`: llama a `z.toJSONSchema` (con `unrepresentable: "any"`) y limpia el ruido: el `$schema`, el `maximum`/`minimum` igual a `Number.MAX_SAFE_INTEGER`/`MIN_SAFE_INTEGER`, y el `pattern` cuando hay `format: "date"`.
   - `body(schema, { example })`: un `requestBody` con `io: "input"`.
   - `query(schema)` y `path(schema)`: convierten un esquema de objeto en una lista de `parameters`. Un parámetro de path es **siempre** `required: true`, y la `description` de la propiedad sube al parámetro.
2. Escribe un script `scripts/zodDemo.js` que imprima `createBookSchema` y `lookupQuerySchema` con `io: "input"` y con `io: "output"`. Responde en un comentario: ¿qué cambia en `stock`? ¿Y en `isbns`? ¿Cuál corresponde documentar para un pedido, y por qué?
3. Busca en el JSON Schema de `createBookSchema` la regla del **dígito de control** del ISBN. ¿Aparece? ¿Y el `refine` de `desde <= hasta` en `queryLoansSchema`?
4. Agrega `.meta({ description, examples })` a los campos donde la regla no se ve en el JSON Schema o no se entiende sola: el `isbn` (dígito de control), `desde`/`hasta` (no puede ser posterior), el `userId` de `createLoanSchema` (solo admin), `sort`, `incluir` y `activos`, `isbns` y `mode` del catálogo. Agrega `examples` a `titulo`, `autor`, `email`, `nombre` y `password`.
5. Corre `npm test`: los 118 tests tienen que seguir pasando. Pregunta para reflexionar: ¿por qué conviene que la descripción viva en el esquema de Zod y no en el archivo de documentación?

### Ejercicio 3: El catálogo de errores y el armador de operaciones
1. Lista todos los códigos de error de la API: `grep -rhn "new AppError(" usecases middlewares security gateways controllers routes dao`. Crea `docs/errorCatalog.js` con `ERROR_CATALOG = { CODE: [status, "mensaje de ejemplo"] }` y una función `errorExample(code)` que devuelva `{ error: { code, message } }` (con `details` en `VALIDATION_ERROR`).
2. Crea `docs/operation.js` con `operation({ tag, id, summary, description, auth, params, query, body, bodyExample, responses, errors })`, y los helpers `ref(name)`, `arrayOf(schema)` y `json(description, schema, extra)`. Reglas:
   - Si hay `params`, `query` o `body` → agrega `VALIDATION_ERROR`.
   - `auth: "user"` o `"admin"` → `security: [{ bearerAuth: [] }]` y los tres `TOKEN_*`. `"admin"` → además `FORBIDDEN`. `"public"` → `security: []`.
   - Los códigos se **agrupan por status**: cada status es una sola respuesta, con `$ref` a `ErrorResponse` y **un ejemplo con nombre por cada `code`**.
   - Si un `code` no está en el catálogo, **lanza un error**.
   - Agrega la extensión `"x-roles"`: `[]`, `["lector", "admin"]` o `["admin"]`.
3. Pregunta para reflexionar: ¿por qué es mejor que un `code` mal escrito haga fallar el armado del documento en lugar de aparecer tal cual en Swagger UI?

### Ejercicio 4: Documentar las 23 operaciones
1. Crea `docs/paths/books.js`, `users.js`, `loans.js`, `auth.js` y `catalog.js`, uno por router, usando **los mismos esquemas** que usa cada router para validar.
2. Para cada operación, **lee el caso de uso** y lista en `errors` cada `code` que puede devolver. No adivines: si un caso de uso no lanza un error, no lo documentes.
3. Casos especiales:
   - `POST /loans`: `201` con el header `Location`, y las reglas R1–R3 en la `description`, contadas para quien consume la API.
   - `GET /books/export.csv`: respuesta `text/csv`, con los headers `Content-Disposition` y `X-Enrichment` (y sus tres valores).
   - `DELETE`: `204` sin `content`.
   - `POST /auth/login`: cómo usar el token en Swagger UI ("Authorize", sin la palabra Bearer).
4. Preguntas para reflexionar (respóndelas en un comentario en `docs/paths/books.js`):
   - ¿Por qué `POST /books/import` responde **200** aunque algunos ISBN fallen? ¿Dónde se entera el cliente de qué falló?
   - ¿Por qué `GET /books/:id/details` responde 200 cuando el catálogo externo está caído, y cómo lo documentaste?

### Ejercicio 5: Las respuestas y el documento completo
1. Crea `docs/responseSchemas.js` con esquemas de Zod **estrictos** (`z.strictObject`) para `Book`, `BookWithUsers`, `BookDetails`, `CatalogInfo`, `ImportReport`, `LookupResult`, `User`, `UserWithBooks`, `LoginResponse`, `Loan` y `ErrorResponse`.
   - Las fechas se describen como **texto**: `z.iso.datetime()` para los instantes y `z.iso.date()` para los días. Pregunta para reflexionar: si el caso de uso devuelve un `Date`, ¿por qué el esquema dice `string`?
   - `User` **no** tiene `passwordHash`.
   - Los campos que solo aparecen a veces (`usuarios`, `libros`, `holidaysAvailable`) son `optional()` y dicen **cuándo** aparecen.
2. Crea `docs/openapi.js` con `buildOpenApiSpec({ serverUrl = "/" })` que devuelva el documento completo: `info` (con una `description` que explique la autenticación, el formato de los errores y cómo vienen las fechas), `servers`, `tags`, `paths`, `components.schemas` (los de respuesta, convertidos con `jsonSchema`), `components.securitySchemes` y el `security` global.
3. `buildOpenApiSpec` **no** puede importar `config.js`. Pregunta para reflexionar: ¿por qué?

### Ejercicio 6: Swagger UI
1. Crea `routes/docsRoutes.js` con `createDocsRouter(spec)` que sirva `GET /openapi.json` y `/docs` (con `persistAuthorization` y `displayRequestDuration`).
2. En `config/config.js` agrega `DOCS_ENABLED`: si no se define, `true` salvo con `NODE_ENV=production`. Agrégala a `.env.example`.
3. En el contenedor, monta el router solo si `DOCS_ENABLED`. En `index.js`, muestra la URL de la documentación al arrancar.
4. Recorre el flujo completo desde `http://localhost:8000/docs`: login con el admin → **Authorize** → `POST /loans` → `PUT /loans/{id}/renew` dos veces (la segunda tiene que dar el 409 documentado). Copia el `curl` que muestra Swagger UI para uno de los pedidos y pégalo en un comentario en `docsRoutes.js`.
5. Preguntas para reflexionar (respóndelas en un comentario en `docsRoutes.js`):
   - ¿Qué pasa si ejecutas `DELETE /books/1` con "Try it out"? ¿Y si la URL de `servers` fuera la de producción?
   - Si apagas la documentación en producción, ¿la API queda más segura? ¿Por qué no alcanza?

### Ejercicio 7: Tests de la documentación
1. Crea `tests/docs/openapi.test.js`:
   - El documento es válido según `SwaggerParser.validate` (pásale un `structuredClone`: ¿por qué?).
   - Cada `operationId` es único; cada operación tiene al menos una respuesta `2xx`; las que exigen token documentan el `401`.
2. **Las rutas reales:** construye los cinco routers con un controlador falso (un `Proxy` que devuelva un handler para cualquier método) y unos `authenticate`/`authorize` falsos **reconocibles** (por ejemplo, `authorize` devuelve una función con una propiedad `roles`). Lee `router.stack` y arma la lista `"GET /books/{id}"` con su acceso (`public`, `user` o `admin`).
3. Con esa lista, verifica que cada ruta de Express está documentada, que cada operación documentada existe en Express, y que el acceso documentado (`security` + `x-roles`) coincide con el del router.
4. Al construir `createAuthRouter` en el test, algo va a explotar. Arréglalo **inyectando** lo que falta, como en el ejercicio 7 de la clase 14. Pregunta para reflexionar: ¿qué tienen en común este problema y el de `createBook` de la clase 14?
5. Agrega una verificación de que la lista de rutas tiene más de 20 elementos. Pregunta para reflexionar: ¿qué pasaría con "cada ruta está documentada" si un bug hiciera que la lista quede vacía?
6. **Velo en rojo:** agrega `router.get("/stats", controller.list)` en `booksRoutes.js` sin documentarla, y cambia el `auth` de una operación documentada. Anota qué tests fallan y con qué mensaje. Después deja todo como estaba.
7. Crea `tests/docs/docsRoutes.test.js` que monte **solo** `createDocsRouter` en una app de Express nueva y verifique con `supertest` que `GET /openapi.json` responde JSON con `openapi: "3.1.0"` y que `GET /docs/` responde la página de Swagger UI.

### Ejercicio 8: Tests de contrato
1. Crea `tests/contract/responses.test.js` con `wire(value)` (`JSON.parse(JSON.stringify(value))`) y `expectToMatchContract(schema, value)`, que muestre los `issues` de Zod cuando falla.
2. Ejecuta los casos de uso de verdad (con `buildLoanScenario`, DAOs en memoria y el catálogo falso con `latencyMs: 0`) y verifica contra su esquema:
   - Préstamos: `createLoan`, `getLoans` (con un préstamo vencido y uno devuelto), `renewLoan` y `returnLoan`.
   - Libros: `getBooks` (con y sin `incluir=usuarios`), `createBook`, `getBookDetails` (`ok` y `no_isbn`) e `importBooks` con un ISBN de cada tipo (importado, repetido, inexistente y fallido).
   - Catálogo: `lookupIsbns` en los tres modos.
   - Autenticación: `login` (con hasher y tokens falsos), `register` y `getProfile` con `incluir=libros`.
   - Errores: el cuerpo que arma el `errorHandler` cumple `ErrorResponse`, y un usuario con `passwordHash` **no** cumple `User`.
3. Si algún test falla, **no lo arregles a ciegas**: decide si está mal la documentación o el código, y anota en un comentario qué encontraste y qué decidiste.
4. Pregunta para reflexionar: ¿qué verifica un test de contrato que **no** verifican los tests de la clase 14?

### Ejercicio 9: Documentar es hacerse preguntas
1. Al documentar `PUT /books/:id` tuviste que pensar sus errores. Prueba en el `.http`: crea un libro con un ISBN propio y después actualízalo con el ISBN de **otro** libro. Hazlo con `PERSISTENCE_TYPE=memory` y con `sequelize`, y anota qué responde cada uno.
2. Escribe primero el test en `tests/usecases/books/updateBook.test.js` (debe fallar):
   - El ISBN de otro libro → `409 ISBN_DUPLICATE`, y el libro no cambió.
   - Reenviar el ISBN que el libro **ya tiene** no es un duplicado.
3. Arregla `updateBook` y comprueba que el test pasa. Agrega `ISBN_DUPLICATE` a los errores documentados de `PUT /books/{id}`.
4. Agrega al `.http` los bloques que lo prueban.

### Ejercicio 10: La colección de pruebas
1. En `requests.http`, reemplaza todas las apariciones de `http://localhost:8000` por una variable `@baseUrl`, definida una sola vez al principio.
2. Agrega una sección "Clase 15" con `GET {{baseUrl}}/openapi.json` y una nota sobre cómo abrir `/docs`.
3. Crea `scripts/exportOpenApi.js` y el script `npm run docs:export`, que escriba el contrato en `openapi.json`. La URL del servidor se recibe como **argumento** (`npm run docs:export -- openapi.json https://mi-servidor`), no con `process.env`. Agrega `openapi.json` al `.gitignore`.
4. Importa `openapi.json` en Postman, Insomnia o Bruno y ejecuta el login y un `GET /books` desde ahí.
5. Pregunta para reflexionar: ¿por qué `openapi.json` va en el `.gitignore`? ¿Qué tendrías que agregar si tu equipo decidiera versionarlo?

### Ejercicio 11: El README
1. Escribe `README.md` con las secciones de la sección 14 del material: qué es, requisitos, puesta en marcha, variables de entorno (**todas**, con su valor por defecto y para qué sirven), scripts, endpoints (resumen + enlace a `/docs`), reglas de negocio, arquitectura (con un diagrama Mermaid y las decisiones importantes), tests, cómo probar a mano, limitaciones conocidas y problemas frecuentes.
2. Agrega `"engines"` a `package.json` con la versión de Node que pide el README.
3. **La prueba del compañero:** intercambia el repositorio con alguien del curso. Cada uno clona el del otro **en una carpeta nueva** y lo levanta siguiendo **solo** el README, sin preguntar nada. Anota cada vez que se trabó.
4. Corrige el README con lo que anotó tu compañero, y deja la lista de lo que corregiste al final de este ejercicio (en un comentario en el PR, o en un archivo `notas-readme.md`).

### Ejercicio 12: El checklist
1. Copia el checklist de la sección 15 del material en `checklist.md`. Marca cada ítem con ✅ (se cumple), 🔧 (no se cumplía y lo corregiste) o ⚠️ (no se cumple, a sabiendas), y escribe la **evidencia** de cada uno: el comando, el test o el archivo que lo demuestra.
2. Corrige al menos **tres** ítems. Pistas para buscar:
   - `grep -rn "new Date()" usecases/`: ¿hay algún caso de uso que lea la hora por su cuenta? Si lo encuentras, piensa también **en qué zona horaria** da la fecha. Escribe el test primero (con un reloj fijo a las 22:30 de Buenos Aires).
   - `grep -rn "process.env" --include=*.js . | grep -v node_modules`: ¿se lee en algún lugar además de `config/config.js`? ¿Esa variable está en `.env.example` y en el README?
   - ¿`package.json` declara la versión de Node?
3. Cada ⚠️ tiene que estar en la sección **Limitaciones conocidas** del README.
4. Corre `npm test` y `npm run coverage` al final. Todo en verde.
5. Pregunta para reflexionar: si la regla "los casos de uso no llaman a `new Date()`" es de la clase 13, ¿cómo pudo quedar un `new Date()` en un caso de uso? ¿Qué te dice eso sobre **cuándo** conviene pasar un checklist?

### Ejercicio 13 (Opcional Avanzado)
1. **Linter:** corre `npx @redocly/cli lint openapi.json`. Corrige las advertencias que tengan sentido y explica en un comentario por qué ignoraste las demás.
2. **El catálogo de errores, verificado:** escribe un test que lea los archivos de `usecases/`, `middlewares/`, `security/` y `gateways/`, extraiga cada `new AppError("CODIGO"` con una expresión regular y verifique que **todos** los códigos están en `ERROR_CATALOG`. Agrega un `AppError` nuevo sin documentarlo y velo en rojo.
3. **Contrato versionado:** versiona `openapi.json` y escribe un test que falle si el archivo no coincide con `buildOpenApiSpec()`. Pregunta para reflexionar: ¿qué gana quien revisa un *pull request*?
4. **Otra UI:** sirve el mismo documento con Scalar o con Redoc en `/reference`. ¿Qué cambia? ¿Qué UI le darías a un equipo de front y cuál a un cliente externo?
5. **Tipos para el front:** genera tipos de TypeScript con `npx openapi-typescript openapi.json -o api-types.d.ts`. Busca el tipo de la respuesta de `POST /loans`: ¿coincide con el esquema `Loan`?
6. **Validación de respuestas en desarrollo:** con `express-openapi-validator` (o con los esquemas de `responseSchemas.js` en un middleware que solo se active con `NODE_ENV=development`), haz que una respuesta que no cumple el contrato se registre en la consola.
7. **Con un agente de IA:** pídele a un agente que mejore las `description` y los ejemplos de `docs/paths/users.js`, usando como arnés: "no cambies esquemas ni rutas; terminaste cuando `npm test` pasa". Revisa cada `code` y cada campo que agregó contra el caso de uso. Pregunta para reflexionar: ¿encontraste algo inventado que los tests **no** detectaron? ¿Qué test lo habría detectado?

¡Éxitos! La próxima clase (16) es el **simulacro de examen**: un enunciado nuevo, con tiempo acotado y feedback individual. El checklist de hoy es tu guía para repasar.
