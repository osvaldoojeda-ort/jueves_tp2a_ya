# Clase 14 — Consigna de Práctica (Tarea Integradora)

En esta clase viste qué es un **test automático** y por qué cuida las reglas contra las **regresiones**, cómo usar **Vitest** (`describe`, `it`, `expect`, `it.each`, `beforeEach`), la estructura **Arrange / Act / Assert**, cómo testear **errores** asíncronos, los **dobles de prueba** (fake, stub, spy) y cómo mantener cada test **aislado y determinista** con un reloj fijo.

Hoy la biblioteca tiene reglas finas (límite de préstamos, vencimientos en días hábiles, renovaciones) y la única forma de saber si siguen funcionando es ejecutar a mano decenas de bloques del `.http`, reiniciando el servidor para "viajar en el tiempo". El objetivo es **automatizar esas verificaciones** con tests unitarios de los casos de uso y del dominio, **sin infraestructura**: sin levantar el servidor, sin base de datos, sin red y sin `.env`. Todo lo que inyectamos durante el curso (DAOs, reloj, gateways, hasher, tokens, eventos) es lo que hoy vamos a reemplazar por dobles.

> **Antes de empezar:** copia el proyecto de la clase 13 y ejecuta `npm install`. Los tests de hoy **no** necesitan `.env`: si un test te pide `JWT_SECRET`, es una pista (ver el ejercicio 7).

---

## Tarea Integrada: Tests de los casos de uso

Sigue estos pasos en orden:

### Ejercicio 1: Instalación y configuración
1. Instala Vitest y el proveedor de cobertura como dependencias de desarrollo: `npm install -D vitest @vitest/coverage-v8`.
2. Agrega a `package.json` los scripts `test` (`vitest run`), `test:watch` (`vitest`) y `coverage` (`vitest run --coverage`).
3. Crea `vitest.config.js` que:
   - Busque los tests en `tests/**/*.test.js`.
   - Use `environment: "node"` y `restoreMocks: true`.
   - Mida cobertura con `provider: "v8"` solo sobre `domain/`, `usecases/` y `utils/`, con los reportes `text` y `html`.
4. Agrega `coverage/` al `.gitignore`.
5. Crea la carpeta `tests/` con la misma estructura que el proyecto (`tests/domain`, `tests/utils`, `tests/usecases/loans`, ...) y una carpeta `tests/helpers`.
6. Pregunta para reflexionar: ¿por qué Vitest va en `devDependencies` y no en `dependencies`? ¿Qué pasaría en producción si estuviera en `dependencies`?

### Ejercicio 2: Funciones puras (el primer test)
1. Crea `tests/utils/isbn.test.js` para `hasValidIsbn13Checksum`:
   - Acepta `9780156012195` y `9780060883287`.
   - Rechaza un ISBN con el último dígito cambiado y otro con **dos dígitos intercambiados**.
   - **Borde:** acepta `9780000000040`, cuyo dígito de control es `0`. Pregunta para reflexionar: ¿qué implementación incorrecta deja pasar todos los demás casos pero falla solo en este?
2. Crea `tests/domain/businessDays.test.js` para `addBusinessDays` usando **`it.each`** con una tabla que incluya al menos:
   - Desde el miércoles `2026-11-04`, 10 días hábiles → `2026-11-18`; con el feriado `2026-11-09` → `2026-11-19`.
   - De viernes a lunes; empezando un sábado; empezando un domingo; fin de semana largo.
   - `0` días no mueve la fecha.
   - Cruzando el fin de año (`2026-12-20` + 10, con los feriados del 25/12 y del 1/1).
   - Cruzando un 29 de febrero (`2028-02-25` + 3).
   - Un feriado que cae en fin de semana no resta nada.
3. Agrega tests para `isBusinessDay`, `addCalendarDays` y `daysBetween` (incluido un resultado negativo).
4. Crea `tests/domain/loanStatus.test.js`:
   - `isOverdue`: antes del vencimiento, **el mismo día** (borde: no está vencido), al día siguiente, y un préstamo devuelto tarde (nunca está vencido).
   - `loanStatus`: los tres estados con `it.each`.
   - `withStatus`: agrega `estado` y `diasAtraso` **sin modificar el objeto original**, y con `null` devuelve `null`.
5. Corre `npm run test:watch`, cambia el `<` de `isOverdue` por `<=` y mira qué tests se ponen en rojo. Vuelve a dejarlo como estaba.

### Ejercicio 3: Utilidades
1. `tests/utils/clock.test.js`:
   - Con `fixedNow`, `now()` devuelve siempre el mismo instante.
   - `today()` usa la zona de la biblioteca: con `fixedNow: "2026-11-05T02:30:00Z"`, hoy es `2026-11-04`.
   - `startOfDay("2026-11-04")` es `2026-11-04T03:00:00.000Z`.
   - Un `fixedNow` inválido lanza un error **al crear el reloj**. Usa `expect(() => ...).toThrow(...)`. Pregunta para reflexionar: ¿por qué hace falta la función flecha?
2. `tests/utils/csv.test.js` para `escapeCell` (con `it.each`) y `toCsv`:
   - Celdas con coma, con comillas, con salto de línea.
   - Inyección de fórmulas: `=HYPERLINK(...)` y `@SUMA(A1)` se neutralizan; el **número** `-5` no se toca, pero el **texto** `"-5"` sí.
   - Con separador `;`, la coma ya no obliga a usar comillas.
   - `toCsv` arma BOM + encabezado + filas separadas por `\r\n`, y sin filas devuelve solo el encabezado.
3. `tests/utils/mapWithConcurrency.test.js`:
   - Con 10 elementos y `limit = 3`, nunca hay más de 3 tareas simultáneas (usa un contador `enCurso` y otro `maximo`).
   - Los resultados vuelven **en el mismo orden** aunque el primero tarde más.
   - Un elemento que falla no cancela a los demás.

### Ejercicio 4: El helper de escenarios
Crea `tests/helpers/loanScenario.js`.
1. Exporta los actores `ANA` (`{ id: 1, rol: "lector" }`), `BETO` (`{ id: 2, rol: "lector" }`) y `ADMIN` (`{ id: 99, rol: "admin" }`).
2. Exporta `buildLoanScenario({ now, books, users, loanRules, holidays, lowStockThreshold })` que:
   - Cree **instancias nuevas** de `BooksMemoryDao`, `UsersMemoryDao` y `LoansMemoryDao` (conectado a esas dos), un bus de eventos, un reloj fijo (por defecto el miércoles `2026-11-04T12:00:00-03:00`) y los feriados falsos.
   - Use reglas por defecto `{ maxActive: 3, businessDays: 10, maxRenewals: 1 }`, que cada test pueda pisar parcialmente.
   - Arme los casos de uso con **`makeLoanUseCases`**, la misma factory que usa el contenedor.
   - Devuelva `{ useCases, loansDao, booksDao, usersDao, events, clock, holidays, givenLoan, stockOf }`.
3. Incluye al menos 6 libros con stock 5 y uno **agotado** (stock 0).
4. `givenLoan({ userId, bookId, fechaPrestamo, fechaVencimiento, renovaciones, devueltoEl })` crea un préstamo **directamente en el DAO** (sin pasar por las reglas), para preparar el pasado: un préstamo vencido, uno ya renovado, uno devuelto.
5. `stockOf(bookId)` devuelve el stock actual de un libro.
6. Preguntas para reflexionar (respóndelas en un comentario al inicio del helper):
   - ¿Por qué no usamos la instancia que exporta cada DAO (`export default new BooksMemoryDao()`)?
   - ¿Por qué hay que **copiar** cada libro (`books.map((b) => ({ ...b }))`) antes de pasárselo al DAO? Pista: mira qué hace `adjustStock`.

### Ejercicio 5: `createLoan`, regla por regla
Crea `tests/usecases/loans/createLoan.test.js`. Agrupa con `describe` y nombra cada test como **situación → resultado**. Para cada error verifica `code` y `statusCode` con `await expect(...).rejects.toMatchObject(...)`.
1. **Caso feliz:** presta el libro con vencimiento `2026-11-19` (por el feriado del 9), `estado: "activo"`, `diasAtraso: 0`, `holidaysAvailable: true`, y el stock baja en 1. En otro test, verifica que `fechaPrestamo` es la del reloj inyectado.
2. **Permisos y existencia:** un lector a nombre de otro → `403 FORBIDDEN`; el admin sí puede; usuario inexistente → `404 USER_NOT_FOUND`; libro inexistente → `404 BOOK_NOT_FOUND`.
3. **Estado del libro:** el mismo libro dos veces → `409 ALREADY_LOANED`; libro agotado → `409 OUT_OF_STOCK`, y además **no quedó ningún préstamo** registrado.
4. **R1**, con los cuatro casos de la clase 13:
   - Borde: con 2 activos, el tercero se presta.
   - Con 3 activos, el cuarto se rechaza con `LOAN_LIMIT_REACHED` y el mensaje contiene el límite (`expect.stringContaining`).
   - Tras el rechazo, el stock del libro 4 y la cantidad de préstamos activos no cambiaron.
   - Además: los devueltos no cuentan; el límite es por usuario; con `maxActive: 1` el segundo ya se rechaza.
5. **R3:**
   - Con un préstamo vencido → `USER_HAS_OVERDUE_LOANS`, con el préstamo vencido en `details`.
   - Borde: si vence **hoy**, puede pedir otro.
   - El mismo escenario un día después (otro `now`) se rechaza.
   - Un vencido que ya se devolvió no bloquea.
   - **Orden:** si tiene 3 activos y uno de ellos vencido, el error es `USER_HAS_OVERDUE_LOANS` y no `LOAN_LIMIT_REACHED`.
6. **R2 y el gateway de feriados:**
   - *Fail fast:* espía `holidays.getHolidays` con `vi.spyOn` y verifica que **no se llama** si una regla rechaza el pedido. Pista: hay que limpiar las llamadas de la preparación con `mockClear()`.
   - Con `createFakeHolidays({ fail: true })`, el préstamo se crea con vencimiento `2026-11-18` y `holidaysAvailable: false`. Silencia `console.warn` con `vi.spyOn(...).mockImplementation(() => {})` y verifica que se llamó una vez.
   - Con un stub cuyo `getHolidays` rechaza con un `TypeError` (un bug propio), el error **se propaga** y no se presta nada.
7. **Evento:** con `lowStockThreshold: 4`, registra un listener `vi.fn()` en `book.lowStock` y verifica que se llamó una vez con `{ id, titulo, stock }`. Con `lowStockThreshold: 3` no se llama.
8. Haz fallar a propósito un test asíncrono quitándole el `await` y cambiando el `code` esperado. ¿Se pone en rojo? Explica en un comentario por qué.

### Ejercicio 6: `renewLoan`, `returnLoan` y `calculateDueDate`
1. `tests/usecases/loans/renewLoan.test.js`, la cadena completa de R4:
   - Renueva un préstamo que vence el `2026-11-19`: el nuevo vencimiento es `2026-12-04`, es decir que se cuenta **desde el vencimiento actual** y no desde hoy (y saltea el feriado del 23). `renovaciones` pasa a `1`.
   - `LOAN_NOT_FOUND` (404), `FORBIDDEN` (403, pero el admin sí puede), `ALREADY_RETURNED`, `LOAN_OVERDUE` (409).
   - Borde: el mismo día del vencimiento todavía se puede renovar.
   - La segunda renovación → `RENEWAL_LIMIT_REACHED`, y el vencimiento **no cambió**.
   - Con `maxRenewals: 2` se renueva dos veces, y el mensaje dice "2 veces".
   - **Orden:** un préstamo ajeno **y** devuelto responde `403`, no `409`.
   - Simula la carrera reemplazando `loansDao.renew` por una función que devuelve `null`: el caso de uso responde `409 LOAN_CHANGED`.
2. `tests/usecases/loans/returnLoan.test.js`:
   - A tiempo: `estado: "devuelto"`, `atrasoAlDevolver: 0`, la fecha de devolución la puso el reloj, y el stock se repone.
   - Un préstamo vencido **sí** se puede devolver, e informa los días de atraso.
   - Devolver dos veces → `ALREADY_RETURNED`, y el stock se repuso **una sola vez**.
   - Ajeno → `403` para un lector; el admin sí puede. Inexistente → `404`.
3. `tests/usecases/loans/calculateDueDate.test.js`, con un **stub** armado con `vi.fn()` que devuelve feriados según el año:
   - Un plazo que cruza el fin de año pide **los dos** años (`toHaveBeenCalledWith(2026)` y `2027`).
   - A principios de año se pide **un solo** año (`toHaveBeenCalledTimes(1)`).
   - Un `AppError` del gateway degrada; un `ReferenceError` se propaga.

### Ejercicio 7: El test que no se deja escribir
1. Crea `tests/usecases/books/createBook.test.js`, importa `createBook` y corre los tests **sin `.env`**. Copia en un comentario el error que aparece.
2. Pregunta para reflexionar: ¿qué tiene que ver crear un libro con `JWT_SECRET`? Sigue los `import` hasta encontrar el motivo.
3. Corrige el **diseño**, no el test. Inyecta el umbral de stock bajo, igual que se hizo con `loanRules` en la clase 13:
   - `createBook(data, dao, events, lowStockThreshold)` y `updateBook(id, changes, dao, events, lowStockThreshold)` ya no importan `config.js`.
   - `makeBookUseCases(dao, loansDao, events, catalog, { importConcurrency, lowStockThreshold })`.
   - En `container/container.js`, pasa `LOW_STOCK_THRESHOLD`.
4. Ahora escribe los tests usando `beforeEach` (un DAO nuevo y `events = { emit: vi.fn() }` antes de cada test):
   - `createBook`: guarda y asigna id; ISBN repetido → `409 ISBN_DUPLICATE` y no se guardó nada; con stock ≤ umbral emite `book.lowStock`; borde (umbral + 1) no emite; con umbral 10, un stock de 5 ya emite.
   - `updateBook`: stock negativo → `400 INVALID_STOCK` sin tocar el libro; inexistente → `null`; si el cambio deja el stock bajo, emite; editar solo el título **no** emite.
5. Levanta el servidor y ejecuta los bloques `24` a `28` de `requests.http`. Las alertas de stock bajo tienen que seguir apareciendo igual que antes: el refactor no cambió el comportamiento.
6. Pregunta para reflexionar: se podría haber "arreglado" el test definiendo `JWT_SECRET` en la configuración de Vitest o con `vi.mock("../../config/config.js")`. ¿Por qué es peor?

### Ejercicio 8: Dobles para lo lento y lo externo
1. `tests/usecases/auth/loginUser.test.js`. Reemplaza bcrypt y JWT por **stubs** con el mismo contrato:
   - `hasher = { hash: vi.fn(async (p) => "hash:" + p), compare: vi.fn(async (p, h) => h === "hash:" + p) }`
   - `tokens = { sign: vi.fn(() => "token-de-prueba") }`
   
   Tests:
   - Con credenciales correctas devuelve `{ token, user }`, y `user` **no** trae `passwordHash`.
   - Firma el token con `{ sub: "7", rol: "lector" }` y nada más.
   - Contraseña incorrecta → `401 INVALID_CREDENTIALS`, y `tokens.sign` no se llamó.
   - Email inexistente → **exactamente** el mismo `code`, `message` y `statusCode` que una contraseña incorrecta.
   - Con un email inexistente, `hasher.compare` igual se llama contra el hash falso (protección contra ataques de tiempo de la clase 11).
2. `tests/usecases/books/importBooks.test.js`, con un **stub** del catálogo que responde según el ISBN (encontrado, `null`, o un `AppError` 502):
   - El informe separa `imported`, `skipped`, `notFound` y `failed`.
   - Un ISBN que ya está en la base **no** consulta el catálogo.
   - Un ISBN repetido en la lista se consulta **una sola vez**.
3. Pregunta para reflexionar: ¿cuánto tardaría la suite si `loginUser` usara bcrypt real con 10 rondas en cada test? ¿Y si `importBooks` consultara Open Library?

### Ejercicio 9: ¿Mis tests protegen algo?
1. Ejecuta `npm run coverage` y abre `coverage/index.html`. Completa en un comentario al inicio de `tests/helpers/loanScenario.js`:

   | Carpeta | % Lines | % Branch | Un archivo o una línea sin cubrir que te parezca importante |
   |---|---|---|---|
   | `domain` | | | |
   | `usecases/loans` | | | |
   | `usecases/books` | | | |

2. **Rompe el código a propósito**, de a un cambio por vez, corre `npm test` y anota cuántos tests fallan. Después deja el código como estaba:
   - En `createLoan`: `>=` por `>` en R1.
   - En `isOverdue`: `<` por `<=`.
   - En `hasValidIsbn13Checksum`: quita el último `% 10`.
   - En `calculateDueDate`: borra la línea `if (!(err instanceof AppError)) throw err;`.
   - En `renewLoan`: cambia `fromDate: loan.fechaVencimiento` por `fromDate: today`.
3. Si alguno de esos cambios **no** hizo fallar ningún test, escribe el test que falta.
4. Pregunta para reflexionar: ¿un 100% de cobertura garantiza que no hay bugs? Da un ejemplo de un test que sube la cobertura sin verificar nada.

### Ejercicio 10 (Opcional Avanzado)
1. **Lo que falta cubrir:** escribe los tests de `getLoans` (un lector solo ve los suyos; pedir los de otro → `403`; `desde`/`hasta` se traducen con `clock.startOfDay`), de `deleteBook` / `deleteUser` (`409` con préstamos) y de la línea de carrera de `returnLoan` (cuando `giveBack` devuelve `null`).
2. **Test de contrato del DAO:** escribe un archivo que ejecute **los mismos** tests sobre `LoansMemoryDao` y `LoansSequelizeDao` (SQLite con `storage: ":memory:"`), usando `describe.each([...])`. Verifica `lend`, `giveBack`, `renew` con `renovacionesPrevias` desactualizado y el `ALREADY_LOANED` del índice único. ¿Encontraste alguna diferencia entre los dos adaptadores?
3. **TDD:** agrega con *test primero* la regla **R6**: "un lector no puede renovar un préstamo si tiene **otro** préstamo vencido" (`409 USER_HAS_OVERDUE_LOANS`). Escribe el test, comprueba que falla (rojo), implementa lo mínimo (verde) y refactoriza.
4. **Integración HTTP:** instala `supertest` y prueba `POST /loans` de punta a punta (con token, `201` y header `Location`; sin token `401`). Para eso vas a necesitar separar en `index.js` la creación de la app (`createApp()`) del `app.listen()`. ¿Por qué?
5. **Integración continua:** crea `.github/workflows/test.yml` para que `npm test` corra en cada *push*.
6. **Con un agente de IA:** sigue `prompt-agente.md` para escribir con un agente los tests de un caso de uso que todavía no tenga tests (por ejemplo `getLoans` o `deleteUser`), aplicando SDD (spec aprobada antes de los tests) y el `AGENTS.md` como arnés. Entrega la spec aprobada, los tests y la tabla de mutaciones del paso 4. Pregunta para reflexionar: ¿qué escenarios agregaste o corregiste vos en la revisión de la spec que el agente no había propuesto?

7. **Otra herramienta:** reescribe `tests/utils/isbn.test.js` y `tests/domain/loanStatus.test.js` con `node:test` y `node:assert/strict` (sin instalar nada) en archivos `*.node.test.js`, y córrelos con `node --test`. Pregunta para reflexionar: ¿qué extrañaste de Vitest? ¿En qué tipo de proyecto elegirías `node:test`?
8. **Testing exploratorio (rol de QA):** durante 20 minutos, prueba la API **a mano** con el `.http` o con Postman, **sin guion**, buscando comportamientos raros (tipos de datos inesperados, ids negativos, el mismo pedido muchas veces seguidas, fechas en el borde con `CLOCK_NOW`, tokens vencidos...). Por cada problema que encuentres, escribe un **reporte de bug** en `bugs.md` con: título, pasos para reproducir, resultado esperado, resultado obtenido y entorno (`PERSISTENCE_TYPE`, `CLOCK_NOW`, `HOLIDAYS_TYPE`). Después elige uno y conviértelo en un test automático que falle mientras el bug exista.

¡Éxitos! La próxima clase (15) seguimos con **calidad**: documentamos la API con Swagger/OpenAPI, escribimos un README profesional y repasamos un checklist de buenas prácticas.
