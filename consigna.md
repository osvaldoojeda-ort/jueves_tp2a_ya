# Clase 13 — Consigna de Práctica (Tarea Integradora)

En esta clase viste los **tipos de validación** (forma, permisos, existencia, reglas de negocio, integridad) y en qué capa vive cada uno, las **validaciones cruzadas** (entre campos con `refine` y entre entidades en el caso de uso), los estados que **se calculan y no se guardan**, el **reloj como dependencia** y un repaso de **status codes** con criterio.

Hoy la biblioteca "funciona", pero no se comporta como una biblioteca: un socio puede llevarse 100 libros, los préstamos no vencen nunca y no hay forma de renovar. El objetivo es implementar estas reglas sobre el módulo de préstamos, respetando la Arquitectura en Capas: las reglas viven en los **casos de uso**, que no leen `process.env`, ni llaman a `new Date()` ni a `fetch`; todo llega por inyección desde el Composition Root.

| # | Regla | Si se rompe |
|---|---|---|
| R1 | Un usuario puede tener **como máximo 3 préstamos activos** | `409 LOAN_LIMIT_REACHED` |
| R2 | Todo préstamo **vence a los 10 días hábiles** (sin sábados, domingos ni feriados) | — (se calcula) |
| R3 | Un usuario con **algún préstamo vencido** no puede pedir libros nuevos | `409 USER_HAS_OVERDUE_LOANS` |
| R4 | Un préstamo se puede **renovar una sola vez**, si no está vencido ni devuelto | `409 RENEWAL_LIMIT_REACHED` / `LOAN_OVERDUE` / `ALREADY_RETURNED` |
| R5 | El **ISBN** de un libro debe tener un **dígito de control válido** | `400 VALIDATION_ERROR` |

> **Antes de empezar:** el modelo de préstamos cambia (columnas nuevas y un índice). Como el proyecto usa `sync()` sin `alter` (ver la advertencia de la sección 5 del material), **borra `database.sqlite`** si lo tenías de una clase anterior.

---

## Tarea Integrada: Reglas de negocio en los préstamos

Sigue estos pasos en orden:

### Ejercicio 1: Configuración
1. En `config/config.js` agrega y exporta `LOAN_MAX_ACTIVE` (por defecto `3`), `LOAN_BUSINESS_DAYS` (por defecto `10`), `LOAN_MAX_RENEWALS` (por defecto `1`), `CLOCK_NOW` (vacío por defecto), `HOLIDAYS_TYPE` (`"argentinadatos"` por defecto, o `"fake"`) y `HOLIDAYS_URL` (`https://api.argentinadatos.com`). Agrégalas también a `.env.example`.
2. Pregunta para reflexionar: ¿por qué el tope de préstamos es una variable de entorno y no un `if (n >= 3)` dentro del caso de uso?

### Ejercicio 2: Validaciones de forma (Zod)
1. **R5.** Crea `utils/isbn.js` con `hasValidIsbn13Checksum(isbn)`: multiplica los primeros 12 dígitos alternando por 1 y por 3, suma, y comprueba que el último dígito sea lo que falta para llegar a la decena siguiente.
2. En `schemas/bookSchema.js` encadena la regla al campo `isbn`: primero el `regex` de 13 dígitos y **después** el `refine` con el checksum. Verifica que `9780156012195` pase y `9780156012196` no.
3. Comprueba que el esquema de `POST /books/import` también rechace un ISBN con checksum inválido (reutiliza el mismo campo).
4. **Validación cruzada entre campos.** En `schemas/loanSchema.js` agrega a `queryLoansSchema` los filtros `desde` y `hasta` (fechas `AAAA-MM-DD`, con `z.iso.date()`) y un `refine` que rechace `desde` posterior a `hasta`, informando el error en el campo `desde` (`path`).
5. Pregunta para reflexionar (respóndela en un comentario en `catalogSchema.js`): ¿conviene exigir el dígito de control también en `GET /catalog/lookup`? Pista: ¿qué ISBN usa el catálogo falso para simular errores?

### Ejercicio 3: Funciones puras de dominio y el reloj
1. Crea `utils/clock.js` con `createClock({ fixedNow })` que devuelva `{ now(), today(), startOfDay(date) }`:
   - `today()` devuelve `AAAA-MM-DD` **en la zona horaria de la biblioteca** (`America/Argentina/Buenos_Aires`), no en UTC.
   - Si se pasa `fixedNow`, el reloj queda fijo en ese instante.
2. **R2.** Crea `domain/businessDays.js` con `addBusinessDays(startDate, days, holidays)`. Trabaja con fechas como texto `AAAA-MM-DD`: el día de inicio no cuenta, y se saltean sábados, domingos y los feriados recibidos.
3. **R3.** Crea `domain/loanStatus.js` con:
   - `isOverdue(loan, today)`: `true` si no se devolvió y `fechaVencimiento < today`.
   - `withStatus(loan, today)`: devuelve el préstamo con dos campos **calculados**, `estado` (`activo`, `vencido` o `devuelto`) y `diasAtraso`.
4. Ninguna de estas funciones puede leer la base, la red ni llamar a `new Date()` sin argumentos.
5. Escribe `scripts/businessDaysDemo.js` y ejecútalo con `node scripts/businessDaysDemo.js`. Verifica al menos:
   - Desde el miércoles `2026-11-04`, 10 días hábiles sin feriados → `2026-11-18`; con el feriado del `2026-11-09` → `2026-11-19`.
   - Un plazo que cruza el fin de año (desde `2026-12-20`).
   - El borde de R3: el **mismo día** del vencimiento el préstamo todavía **no** está vencido.
   - Que `2026-11-05T02:30:00Z` es "hoy `2026-11-04`" para la biblioteca.
6. Pregunta para reflexionar: ¿por qué no guardamos una columna `estado` con el valor `vencido`?

### Ejercicio 4: El gateway de feriados
1. Consulta a mano `https://api.argentinadatos.com/v1/feriados/2026` y mira qué valores toma el campo `tipo`.
2. Crea `gateways/argentinaDatosHolidaysGateway.js` con `createArgentinaDatosHolidaysGateway({ baseUrl, timeoutMs })` que respete el contrato `getHolidays(year) → ["2026-01-01", ...]`:
   - Mismos errores que el catálogo de la clase 12: timeout → `EXTERNAL_TIMEOUT` (**504**); red caída, `!response.ok` o JSON inválido → `EXTERNAL_API_ERROR` (**502**).
   - **Caché por año** en memoria: los feriados casi no cambian. Una falla **no** se guarda en la caché.
   - Responde en un comentario: ¿los días de tipo `puente` cuentan como hábiles? Es una decisión de negocio: déjala explícita.
3. Crea `gateways/fakeHolidays.js` (misma interfaz, datos locales) con una opción para simular que la API está caída, y `gateways/holidaysFactory.js` con `getHolidaysGateway()` que elija según `HOLIDAYS_TYPE` (`argentinadatos`, `fake` o `fake-down`).
4. Pregunta para reflexionar: en la clase 12 la caché del catálogo venía **apagada**. ¿Por qué acá sí conviene encenderla?

### Ejercicio 5: Las reglas en los casos de uso
1. Agrega al modelo `LoanModel` las columnas `fechaVencimiento` (`DATEONLY`, obligatoria) y `renovaciones` (entero, por defecto `0`). Agrégalas también al DAO en memoria y a `LOAN_ATTRIBUTES` del DAO de Sequelize.
2. Las fechas las decide el **caso de uso** (con el reloj), no el DAO: cambia `lend({ userId, bookId, fechaPrestamo, fechaVencimiento })` y `giveBack(id, fechaDevolucion)` en los dos DAOs para que ya no llamen a `new Date()`.
3. Crea `usecases/loans/calculateDueDate.js`: pide los feriados de los años que puede abarcar el plazo y devuelve `{ fechaVencimiento, holidaysAvailable }`. Si el gateway falla con un `AppError`, **degrada**: calcula solo con fines de semana y devuelve `holidaysAvailable: false`. Un error que no sea `AppError` no se oculta.
4. En `createLoan` aplica las reglas en este orden y con **una sola** consulta de préstamos activos del usuario:
   - Permiso (403) → existencia de usuario y libro (404) → `ALREADY_LOANED` (409) → **R3** `USER_HAS_OVERDUE_LOANS` (409, con el detalle de los préstamos vencidos en `details`) → **R1** `LOAN_LIMIT_REACHED` (409, el mensaje dice cuál es el límite) → **R2** cálculo del vencimiento → `OUT_OF_STOCK` (409).
   - La respuesta incluye `estado`, `diasAtraso` y `holidaysAvailable`.
   - Pregunta para reflexionar: ¿por qué la API de feriados se consulta **después** de todas las reglas y no al principio?
5. **R4.** Crea `usecases/loans/renewLoan.js` y expón `PUT /loans/:id/renew` (autenticados). Cadena de chequeos: `LOAN_NOT_FOUND` (404) → `FORBIDDEN` (403, un lector solo renueva los suyos) → `ALREADY_RETURNED` (409) → `LOAN_OVERDUE` (409) → `RENEWAL_LIMIT_REACHED` (409). El nuevo vencimiento se cuenta **desde el vencimiento actual**, no desde hoy.
6. Agrega `renew(id, { fechaVencimiento, renovacionesPrevias })` a los dos DAOs como un **UPDATE condicional** (solo si sigue sin devolver y `renovaciones` no cambió). Si no actualiza nada, el caso de uso responde `409 LOAN_CHANGED`.
7. `getLoans` y `getLoanById` devuelven cada préstamo con `withStatus`. `getLoans` traduce `desde`/`hasta` (días) a instantes con `clock.startOfDay` para que el filtro sobre `fechaPrestamo` lo resuelva **la base**.
8. `returnLoan` usa el reloj para la fecha de devolución e informa `atrasoAlDevolver` (un préstamo vencido **sí** se puede devolver).
9. `POST /loans` responde `201` con el header `Location: /loans/:id`. `PUT /loans/:id/renew` responde `200`: ¿por qué no `201`?

### Ejercicio 6: La última línea de defensa (integridad)
1. Agrega a `LoanModel` un **índice único parcial** sobre `userId` + `bookId` solo para las filas con `fechaDevolucion: null`.
2. En `LoansSequelizeDao.lend` atrapa el `UniqueConstraintError` y tradúcelo a `AppError("ALREADY_LOANED", ..., 409)`. En el DAO en memoria haz el chequeo y el alta en el mismo paso síncrono (sin un `await` en el medio).
3. Comprueba que el índice existe: abre `database.sqlite` (o consulta `sqlite_master`) y busca el `CREATE UNIQUE INDEX ... WHERE fechaDevolucion IS NULL`.
4. Prueba que un libro **devuelto** se puede volver a pedir (el índice es parcial).
5. Prueba la carrera: llama dos veces **en paralelo** a `loansDao.lend()` con el mismo usuario y libro (con `Promise.allSettled`, sin pasar por el caso de uso). Una debe crearse y la otra fallar con `ALREADY_LOANED`, y el stock tiene que bajar **una sola vez**.

### Ejercicio 7: Inyección en el Contenedor
Ve al archivo `container/container.js`.
1. Crea el reloj con `createClock({ fixedNow: CLOCK_NOW })`, los feriados con `getHolidaysGateway()` y el objeto `loanRules = { maxActive, businessDays, maxRenewals }`.
2. Pásalos a `makeLoanUseCases({ loansDao, booksDao, usersDao, events, clock, holidays, loanRules, lowStockThreshold })`. El umbral de stock bajo (clase 10) también pasa a llegar por inyección: hasta ahora `createLoan` lo importaba de `config.js`.
3. Verifica que **ningún** archivo de `usecases/loans/` importe `config.js`, llame a `new Date()` o a `fetch`.

### Ejercicio 8: Verificación Funcional
1. Arranca con `PERSISTENCE_TYPE=sequelize` y `HOLIDAYS_TYPE=fake`, y ejecuta los bloques `C1` a `C22` de `requests.http`, verificando el código que indica cada título. Para cada regla tienen que aparecer los cuatro casos: el feliz, el borde, el que la viola y que **el estado no cambió** tras el rechazo (`C12`).
2. Reinicia con `HOLIDAYS_TYPE=fake-down` (o con `HOLIDAYS_URL=http://localhost:9922`) y ejecuta `C23`: el préstamo se crea igual con `holidaysAvailable: false`.
3. **Viaje en el tiempo:** reinicia con `CLOCK_NOW=2027-01-15T12:00:00Z` y ejecuta `C24` a `C27`. Los préstamos aparecen `vencido` sin que nada se haya actualizado en la base.
4. Arranca con `HOLIDAYS_TYPE=argentinadatos` y compara el vencimiento de un préstamo nuevo con el que da `fake`.
5. Repite `C1` a `C22` con `PERSISTENCE_TYPE=memory`: el resultado debe ser idéntico.
6. Completa en un comentario al inicio de `createLoan.js` esta tabla con los códigos que devuelve tu API:

   | Situación | Status | `code` |
   |---|---|---|
   | Body sin `bookId` | | |
   | Sin token | | |
   | Un lector pide a nombre de otro | | |
   | El libro no existe | | |
   | Ya tiene 3 préstamos activos | | |
   | Tiene un préstamo vencido | | |
   | No hay stock | | |
   | La API de feriados está caída | | |

### Ejercicio 9 (Opcional Avanzado)
1. **R1 sin carrera:** el índice único no puede expresar "como máximo 3". Haz el conteo y el alta **dentro de la misma transacción** en `LoansSequelizeDao` y demuestra con pedidos en paralelo que un usuario con 2 préstamos no puede quedar con 4.
2. Agrega a `GET /loans` un filtro `?vencidos=true`. ¿Se puede resolver en la base aunque "vencido" no sea una columna? (pista: `fechaVencimiento < hoy AND fechaDevolucion IS NULL`).
3. Decide y documenta: si un lector pide `GET /loans/5` y ese préstamo es de otra persona, ¿`403` o `404`? Implementa tu decisión y justifícala en un comentario.
4. Pregunta para reflexionar: si mañana la biblioteca tiene sedes en dos provincias con feriados distintos, ¿qué partes del diseño cambian y cuáles no?

¡Éxitos! La próxima clase (14) es de **calidad**: escribimos tests automáticos de los casos de uso con Jest o Vitest, sin base ni red. Todo lo que hoy diseñaste como función pura (`addBusinessDays`, `isOverdue`, el reloj fijo, los feriados falsos) es exactamente lo que se va a testear.
