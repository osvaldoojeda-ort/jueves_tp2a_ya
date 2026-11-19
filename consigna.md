# Clase 12 — Consigna de Práctica (Tarea Integradora)

En esta clase viste cómo **consumir una API externa** con `fetch`, cómo **encapsularla en un gateway inyectado**, cómo elegir entre pedidos **secuenciales, paralelos y en lote**, y cómo **generar un CSV descargable**. Todo el cableado vive en el Composition Root (`container/container.js`).

Imaginá este día en la biblioteca: llega una caja con 30 libros nuevos y no querés tipear título y autor de cada uno. El objetivo es que **puedas dar de alta libros solo con su ISBN, consultando Open Library**, y además enriquecer los libros existentes y exportar el catálogo a CSV, respetando la Arquitectura en Capas: los casos de uso no conocen `fetch` ni la URL de la API, solo reciben el `catalog` por inyección.

---

## Tarea Integrada: Catálogo externo y exportación a CSV

Sigue estos pasos en orden:

### Ejercicio 1: Explorar la API y configurar
1. Antes de programar, consulta la API a mano (con `curl` o con un bloque en el `.http`):
   `https://openlibrary.org/api/books?bibkeys=ISBN:9780156012195&format=json&jscmd=data`
2. Responde en un comentario al inicio de `gateways/openLibraryGateway.js`:
   - ¿Qué devuelve la API cuando pedís un ISBN que no existe: un 404, o un `{}`?
   - ¿Qué pasa si pedís dos ISBN en el mismo pedido (`ISBN:a,ISBN:b`)?
3. En `config/config.js` agrega y exporta `CATALOG_TYPE` (`"openlibrary"` por defecto, o `"fake"`), `OPEN_LIBRARY_URL`, `EXTERNAL_TIMEOUT_MS` (por defecto `5000`), `IMPORT_CONCURRENCY` (por defecto `3`) y `FAKE_LATENCY_MS` (por defecto `300`). Agrégalas también a `.env.example`.
4. Actualiza los libros semilla de los dos DAOs con ISBN reales: *El principito* `9780156012195` y *Cien años de soledad* `9780060883287`.

### Ejercicio 2: El gateway
1. Crea `gateways/openLibraryGateway.js` con `createOpenLibraryGateway({ baseUrl, timeoutMs })` que retorne `{ getByIsbn(isbn), getManyByIsbn(isbns) }`.
   - `getByIsbn` devuelve la información del libro o `null` si no existe.
   - `getManyByIsbn` devuelve un objeto `{ [isbn]: info }` con un **único pedido** (divide en lotes de 20 si hay más).
2. El gateway debe **traducir** el modelo externo al nuestro: `title → titulo`, `authors[].name → autores`, `publishers[0].name → editorial`, `publish_date → fechaPublicacion`, `number_of_pages → paginas`. Usa `?.` y `??`: la API puede omitir cualquier campo.
3. Maneja los tres tipos de falla y conviértelos en `AppError`:
   - Timeout (`AbortSignal.timeout`) → `EXTERNAL_TIMEOUT`, **504**.
   - Error de red o `response.ok === false` → `EXTERNAL_API_ERROR`, **502**.
   - Cuerpo que no es JSON válido → `EXTERNAL_API_ERROR`, **502**.
4. Envía un `User-Agent` que identifique tu aplicación.
5. Crea `gateways/fakeCatalog.js` con la misma interfaz, datos locales y una demora simulada por pedido. Haz que un ISBN que empiece con `000` simule un error 500.
6. Crea `gateways/catalogFactory.js` con `getCatalog()` que elija el catálogo según `CATALOG_TYPE`, igual que `daoFactory`.
7. Responde en un comentario: ¿por qué `fetch` necesita un `if (!response.ok)` aparte del `try/catch`?

### Ejercicio 3: Detalle enriquecido
1. Crea `usecases/books/getBookDetails.js` y expón `GET /books/:id/details` (solo autenticados).
2. Devuelve el libro local más `externalInfo` y `externalStatus`, que puede ser `ok`, `not_found`, `no_isbn` o `unavailable`.
3. Si el catálogo falla, el endpoint **igual debe responder 200** con `externalStatus: "unavailable"` (degradación elegante). Pero un error que **no** sea del catálogo (un bug propio) no debe ocultarse.
4. Pregunta para reflexionar (respóndela en un comentario en `getBookDetails.js`): ¿por qué el `catch` verifica `instanceof AppError` en lugar de atrapar cualquier error?

### Ejercicio 4: Secuencial, paralelo y en lote
1. Crea `usecases/catalog/lookupIsbns.js` y expón `GET /catalog/lookup?isbns=a,b,c&mode=sequential|parallel|batch` (solo autenticados, hasta 10 ISBN).
2. Cada modo debe devolver el mismo formato: por cada ISBN un resultado con estado `found`, `not_found` o `failed`, más `httpRequests` y `elapsedMs`.
3. Usa `Promise.allSettled` en el modo paralelo y un `for...of` con `await` en el secuencial.
4. Ejecuta los tres modos con 5 ISBN, primero con `CATALOG_TYPE=fake` y después con `openlibrary`, y completa en un comentario esta tabla:

   | Modo | Pedidos HTTP | Tiempo (fake) | Tiempo (real) |
   |---|---|---|---|
   | sequential | | | |
   | parallel | | | |
   | batch | | | |

5. Incluye en la lista un ISBN que empiece con `000` (catálogo falso) y observa qué pasa en cada modo. Responde: ¿por qué en `batch` fallan **todos** los ISBN y en `parallel` solo uno?

### Ejercicio 5: Importar libros con concurrencia limitada
1. Crea `utils/mapWithConcurrency.js`: ejecuta una función sobre cada elemento con como máximo `limit` ejecuciones simultáneas y devuelve resultados con la forma de `Promise.allSettled`.
2. Crea `usecases/books/importBooks.js` y expón `POST /books/import` (solo `admin`) con un body `{ "isbns": [...], "stock": 3 }` (hasta 10 ISBN, validado con Zod).
3. Reglas:
   - Deduplica la lista de ISBN.
   - Si el ISBN ya está en la base, **no consultes la red**: infórmalo como omitido.
   - Consulta los demás con `mapWithConcurrency` usando `IMPORT_CONCURRENCY`.
   - Guarda los libros **de a uno** reutilizando `createBook` (así se dispara la alerta de stock bajo si corresponde).
4. Devuelve un informe `{ imported, skipped, notFound, failed }` con status 200.
5. Comprueba con un contador que nunca hay más de `IMPORT_CONCURRENCY` pedidos simultáneos (por ejemplo, con un script que ejecute `mapWithConcurrency` sobre 10 elementos con una espera simulada).

### Ejercicio 6: Exportar a CSV
1. Crea `utils/csv.js` con `toCsv(rows, columns)` y `escapeCell(value)`:
   - Encierra entre comillas las celdas con coma, comillas o salto de línea, y duplica las comillas internas.
   - Separa las líneas con `\r\n` y antepone el BOM `﻿`.
   - **Neutraliza la inyección de fórmulas**: si un *texto* empieza con `=`, `+`, `-` o `@`, antepone un apóstrofe. Los números negativos **no** se tocan.
2. Crea `usecases/books/exportBooksCsv.js` y expón `GET /books/export.csv` (solo `admin`). Debe aceptar los mismos filtros que el listado (`autor`, `isbn`, `sort`, `page`, `limit`).
3. Con `?enriquecer=true` agrega las columnas `editorial`, `paginas` y `fecha_publicacion`, usando **un único pedido en lote** al catálogo.
4. Si el catálogo falla, el CSV igual se genera con esas columnas vacías, y el header `X-Enrichment` informa `ok`, `unavailable` o `skipped`.
5. Entrega el archivo como descarga con `res.attachment("libros-AAAA-MM-DD.csv")`.
6. Declara `/export.csv` **antes** de `/:id`. Pregunta para reflexionar (respóndela en un comentario en `booksRoutes.js`): ¿qué pasaría si lo declararas después?
7. Prueba `toCsv` con un título como `Hola, "mundo"` y otro como `=HYPERLINK("http://x")`, y verifica el resultado.

### Ejercicio 7: Inyección en el Contenedor
Ve al archivo `container/container.js`.
1. Crea el catálogo con `getCatalog()`.
2. Pásalo a `makeBookUseCases(booksDao, loansDao, events, catalog, { importConcurrency })`.
3. Crea `controllers/CatalogController.js`, `routes/catalogRoutes.js` y `usecases/catalog/makeCatalogUseCases.js`, y móntalos en `/catalog`.
4. Verifica que los casos de uso nuevos no importen `fetch` ni el gateway, y que `IMPORT_CONCURRENCY` y el timeout lleguen por inyección y no leyendo `config.js` dentro del caso de uso.

### Ejercicio 8: Verificación Funcional
1. Ejecuta el bloque `B1` a `B20` de `requests.http` (y `B21` a `B23` si hiciste el ejercicio 9) y verifica cada código de respuesta que indica el título.
2. Arranca con `CATALOG_TYPE=fake` y repite todo **sin conexión a internet**.
3. Apunta `OPEN_LIBRARY_URL` a un puerto donde no haya nada (`http://localhost:9922`) y comprueba que `details` y el CSV enriquecido **siguen respondiendo 200**, mientras que `lookup` informa `EXTERNAL_API_ERROR` por ISBN.
4. Simula un servidor externo colgado (por ejemplo `node -e "require('http').createServer(()=>{}).listen(9911)"`), apunta `OPEN_LIBRARY_URL` ahí con `EXTERNAL_TIMEOUT_MS=1000` y verifica que la respuesta llega a los ~1000 ms con `EXTERNAL_TIMEOUT`.
5. Abre `GET /books/export.csv?enriquecer=true` en el **navegador** (con el token) o impórtalo en Excel / Google Sheets y verifica que los acentos se vean bien.
6. Prueba con `PERSISTENCE_TYPE=memory` y con `sequelize`: el resultado debe ser idéntico.

### Ejercicio 9 (Opcional Avanzado): Más robusto
1. Agrega a `export.csv` un parámetro `?separador=;` para que se abra en columnas separadas en un Excel configurado en español.
2. Agrega una **caché en memoria con vencimiento** (configurable con `CATALOG_CACHE_TTL_MS`, por ejemplo 10 minutos; apagada con `0`, que es el valor por defecto) dentro del gateway, para no repetir pedidos del mismo ISBN. Muéstralo con el tiempo del segundo `details` del mismo libro. Pregunta para reflexionar: ¿por qué conviene que venga apagada por defecto? (pista: probá `/catalog/lookup` con la caché encendida).
3. Agrega **reintentos con espera creciente** (1 s, 2 s, 4 s) en `fetchData` ante errores 5xx, pero **no** ante un 4xx. ¿Por qué no?
4. Pregunta para reflexionar: si el endpoint de importación recibiera 500 ISBN en lugar de 10, ¿qué cambiarías y por qué?

¡Éxitos! La próxima clase volvemos sobre el proyecto integrador para trabajar reglas de negocio finas, validaciones cruzadas y repaso de status codes.
