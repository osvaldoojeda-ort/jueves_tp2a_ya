# Checklist de buenas prácticas — Biblioteca API (Clase 15)

Autoevaluación del proyecto con el checklist de la sección 15 del material. Cada ítem tiene su **evidencia**: el comando, el test o el archivo que lo demuestra. ✅ = se cumple · 🔧 = no se cumplía y se corrigió hoy · ⚠️ = no se cumple, a sabiendas (está en *Limitaciones conocidas* del README).

## Arquitectura

| | Ítem | Evidencia |
|---|---|---|
| ✅ | Los controllers solo traducen HTTP ↔ caso de uso | `controllers/`: solo status codes, headers y el 404 cuando el caso de uso devuelve `null` |
| ✅ | Los casos de uso no conocen Express | `grep -rnE "\b(req\|res)\." usecases/` → sin resultados |
| 🔧 | Los casos de uso no leen `process.env` ni llaman a `new Date()` o `fetch` | `exportBooksCsv` usaba `new Date().toISOString()` para el nombre del CSV (y además daba la fecha en UTC: a las 22:30 salía con la de mañana). Ahora usa el `clock` inyectado. Test: `tests/usecases/books/exportBooksCsv.test.js` |
| ✅ | Todas las dependencias se arman en un solo lugar | `container/container.js` |
| ✅ | La persistencia se cambia sin tocar los casos de uso | `PERSISTENCE_TYPE=memory` / `sequelize` |

## REST y HTTP

| | Ítem | Evidencia |
|---|---|---|
| ✅ | URL con sustantivos en plural, el verbo dice la acción | `/books`, `/loans`, `/users`. Las acciones que no son CRUD van como subrecurso: `PUT /loans/:id/return`, `/renew` |
| ✅ | Crear → `201` (+ `Location` en préstamos); borrar → `204` | `LoansController.create`, `BooksController.remove` |
| ✅ | Status correctos | Cada operación de `/docs` lista sus status y sus `code` |
| ✅ | Ruta inexistente → `404` con el formato estándar | `middlewares/notFound.js` → `ROUTE_NOT_FOUND` |

## Validación y errores

| | Ítem | Evidencia |
|---|---|---|
| ✅ | Todo lo que entra se valida antes del caso de uso | Cada ruta con body/query/params tiene `validate(...)`; la documentación se genera de esos mismos esquemas |
| ✅ | Mismo formato de error en toda la API | `middlewares/errorHandler.js`; test: `contrato: errores` |
| ✅ | Error inesperado → `500` genérico sin detalles internos | `errorHandler.js`: el stack va a la consola, no a la respuesta |
| 🔧 | Cada error posible de cada endpoint está contemplado | `PUT /books/:id` aceptaba el ISBN de **otro** libro (en memoria: duplicado; en Sequelize: 500). Apareció al documentar sus errores. Ahora `409 ISBN_DUPLICATE`. Tests en `updateBook.test.js` |

## Seguridad

| | Ítem | Evidencia |
|---|---|---|
| ✅ | Contraseñas hasheadas que nunca salen en una respuesta | `security/passwordHasher.js`; test de contrato con `z.strictObject` (`User` sin `passwordHash`) |
| ✅ | `JWT_SECRET` sin valor por defecto y fuera del repo | `config.js` lanza un error sin él; `.env` en `.gitignore` |
| ✅ | Escritura protegida y permisos por dueño en el caso de uso | Test `tests/docs/openapi.test.js` (acceso por ruta); tests de `createLoan`, `renewLoan`, `returnLoan` (`FORBIDDEN`) |
| ✅ | Mismo error si el email no existe o la contraseña es incorrecta | `tests/usecases/auth/loginUser.test.js` |
| ✅ | Límite de intentos fallidos de login | `express-rate-limit` en `routes/authRoutes.js` → `429 TOO_MANY_ATTEMPTS` |
| ⚠️ | Un token deja de valer si se borra el usuario o cambia su rol | No: JWT sin estado. Mitigado con `JWT_EXPIRES_IN` corto. En el README |
| ⚠️ | El rate limit funciona con varias instancias del servidor | No: vive en memoria. En el README |

## Configuración y repositorio

| | Ítem | Evidencia |
|---|---|---|
| 🔧 | `process.env` se lee en un solo archivo | `notifications/fileNotifier.js` leía `NOTIFICATIONS_LOG_PATH` por su cuenta (una variable "fantasma": no estaba en `config.js`, ni en `.env.example`, ni en el README). Movida a `config.js`. El script nuevo `docs:export` leía `PUBLIC_URL`: ahora recibe la URL como argumento |
| 🔧 | `.env.example` con todas las variables | Faltaba `NOTIFICATIONS_LOG_PATH`; también se agregó `DOCS_ENABLED` |
| ✅ | `.gitignore` completo | `node_modules/`, `.env*`, `database.sqlite`, `notifications.log`, `coverage/`, `openapi.json` (generado) |
| ✅ | `package-lock.json` versionado | En el repo |
| ✅ | Herramientas de desarrollo en `devDependencies` | `vitest`, `@vitest/coverage-v8`, `supertest`, `@apidevtools/swagger-parser` |
| 🔧 | `package.json` declara la versión de Node | Faltaba. Agregado `"engines": { "node": ">=22" }` |
| 🔧 | Los valores que cambian según el entorno, en un solo lugar (también en las pruebas manuales) | `requests.http` repetía `http://localhost:8000` 134 veces. Ahora `@baseUrl` |

## Persistencia

| | Ítem | Evidencia |
|---|---|---|
| ✅ | Los dos adaptadores respetan la misma interfaz | Mismos métodos en `dao/*/…MemoryDao.js` y `…SequelizeDao.js` |
| ⚠️ | Reglas del tipo "contar y después insertar" a prueba de carreras | R1 (tope de 3) no: dos pedidos simultáneos podrían superarlo por uno. El duplicado del mismo libro sí lo frena un índice único. En el README |
| ⚠️ | Migraciones de base | No: `sync()`; si cambia un modelo hay que borrar `database.sqlite`. En el README |

## Integraciones externas

| | Ítem | Evidencia |
|---|---|---|
| ✅ | Cada API externa detrás de un gateway inyectado, con versión falsa | `gateways/`; `CATALOG_TYPE=fake`, `HOLIDAYS_TYPE=fake` |
| ✅ | Timeout en cada pedido externo | `EXTERNAL_TIMEOUT_MS` (`AbortSignal.timeout`) |
| ✅ | Degradación elegante | `/books/:id/details` → `externalStatus: "unavailable"`; préstamos → `holidaysAvailable: false` |

## Tests

| | Ítem | Evidencia |
|---|---|---|
| ✅ | `npm test` corre sin `.env`, base ni red | 209 tests, ~2 s |
| ✅ | Cada regla con caso feliz, borde, violación y "el estado no cambió" | `tests/usecases/loans/` |
| ✅ | Los tests detectan bugs | Mutaciones de la clase 14, y hoy las de los tests de documentación (ruta sin documentar, acceso cambiado) |

## Documentación

| | Ítem | Evidencia |
|---|---|---|
| 🔧 | Cada endpoint documentado con parámetros, cuerpo, respuestas y cada `code` de error | `/docs` (23 operaciones). El test de contrato encontró `atrasoAlDevolver`, que no estaba documentado |
| ✅ | La documentación se genera del código o se verifica con tests | `docs/` (desde Zod) + `tests/docs/` + `tests/contract/` |
| ✅ | El README permite levantar el proyecto sin preguntar | Probado en un clon limpio siguiendo solo el README |
| ✅ | Limitaciones conocidas escritas | README, sección *Limitaciones conocidas* |

---

## Reflexión (ejercicio 12.5)

**¿Cómo pudo quedar un `new Date()` en un caso de uso, si la regla es de la clase 13?** Porque `exportBooksCsv` es de la clase 12: la regla se escribió **después**, y se aplicó al código que se estaba tocando (los préstamos), no a todo el proyecto. Nadie volvió a mirar el caso de uso del CSV. Lo mismo con la variable fantasma de `fileNotifier.js` (clase 10), y con el `process.env` del script de exportación, que se coló **hoy mismo**.

Un checklist no sirve solo para el código nuevo: sirve para **revisar todo el proyecto** cada tanto (antes de una entrega, antes de un release), y conviene automatizar lo que se pueda (un `grep` en la integración continua, o un test) para no depender de acordarse.

