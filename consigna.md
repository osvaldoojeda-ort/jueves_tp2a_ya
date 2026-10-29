# Clase 11 — Consigna de Práctica (Tarea Integradora)

En esta clase viste cómo **guardar contraseñas con hash (bcrypt)**, cómo **emitir y verificar tokens JWT**, y cómo separar **autenticación** de **autorización**. Todo el cableado vive en el Composition Root (`container/container.js`), igual que el DAO y el sistema de eventos.

El objetivo es que **protejas la API de la Clase 10** respetando la Arquitectura en Capas: los casos de uso no conocen `bcryptjs` ni `jsonwebtoken`, solo reciben `hasher` y `tokens` por inyección.

---

## Tarea Integrada: Login y endpoints protegidos

Sigue estos pasos en orden:

### Ejercicio 1: Dependencias y configuración

1. Instala `bcryptjs` y `jsonwebtoken`.
2. En `config/config.js` agrega y exporta `JWT_SECRET`, `JWT_EXPIRES_IN` (por defecto `"1h"`), `BCRYPT_ROUNDS` (por defecto `10`), `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. `JWT_SECRET` **no puede tener valor por defecto**: si falta, la aplicación debe fallar al arrancar con un mensaje claro.
4. Agrega las variables a `.env.example` y verifica que `.env` esté en `.gitignore`.
5. Responde en un comentario en `config.js`: ¿por qué es peligroso que el secreto tenga un valor por defecto "para desarrollo"?

### Ejercicio 2: Hasheador de contraseñas

1. Crea `security/passwordHasher.js` con `createPasswordHasher({ rounds })` que retorne `{ hash(plain), compare(plain, hash) }` usando `bcryptjs` (versión asíncrona).
2. En un script suelto, hashea **dos veces la misma contraseña** e imprime ambos resultados. Responde en un comentario: ¿por qué los hashes son distintos y aun así `compare` funciona con los dos?
3. Mide cuánto tarda `hash` con `rounds` 4, 10 y 14. ¿Qué observas?

### Ejercicio 3: Modelo y DAOs de usuarios

1. Agrega `passwordHash` (`STRING`, `allowNull: false`) a `dao/models/UserModel.js`.
2. En los dos DAOs de usuarios, agrega `getCredentialsByEmail(email)`, que devuelva `{ id, nombre, email, rol, passwordHash }` o `null`.
3. Verifica que **ningún otro método** devuelva `passwordHash` (`getAll`, `getById`, `getByEmail`, `save`, `update`). En Sequelize, usa `attributes` explícitos.
4. Elimina el usuario sembrado del DAO en memoria (el administrador se siembra desde el contenedor).
5. Si ya tenías un `database.sqlite` de la clase anterior, **bórralo**: las filas viejas no tienen `passwordHash` y la columna es obligatoria.

### Ejercicio 4: Servicio de tokens

1. Crea `security/tokenService.js` con `createTokenService({ secret, expiresIn })` que retorne `{ sign(payload), verify(token) }` usando `jsonwebtoken`.
2. `verify` debe lanzar un `AppError` **401** con código `TOKEN_EXPIRED` si el token venció, y `TOKEN_INVALID` en cualquier otro fallo. Fija `algorithms: ["HS256"]`.
3. Pega un token válido en [jwt.io](https://jwt.io) y responde en un comentario: ¿qué podés ver sin conocer el secreto? ¿Qué no podrías hacer?

### Ejercicio 5: Casos de uso de autenticación

1. En `schemas/userSchema.js` agrega `password` (mínimo 8, máximo 72 caracteres) a `createUserSchema` y como opcional a `updateUserSchema`.
2. Crea `schemas/authSchema.js` con `registerSchema` (el de crear usuario **sin** `rol`) y `loginSchema` (`email` y `password`).
3. Modifica `createUser` y `updateUser` para recibir `hasher` y guardar `passwordHash` en lugar de `password`.
4. Crea `usecases/auth/loginUser.js`: busca las credenciales, compara con el hasher y devuelve `{ token, user }`. Si el email no existe **o** la contraseña no coincide, lanza el **mismo** error `INVALID_CREDENTIALS` (401). Responde en un comentario: ¿por qué el mismo?
5. El payload del token debe contener solo `sub` (el id como string) y `rol`.
6. Crea `usecases/auth/registerUser.js`, que reutilice `createUser` pero **fuerce `rol: "lector"`**.
7. Crea `usecases/auth/seedAdmin.js`, que cree el administrador inicial si no existe, y `usecases/auth/makeAuthUseCases.js` con `register`, `login` y `getProfile`.

### Ejercicio 6: Middlewares de auth

1. Crea `middlewares/auth.js` con `createAuthMiddlewares(tokens)` que retorne `authenticate` y `authorize(...roles)`.
2. `authenticate` lee `Authorization: Bearer <token>`, deja `req.user = { id, rol }` y responde `TOKEN_MISSING` (401) si falta el header.
3. `authorize` responde `FORBIDDEN` (403) si el rol de `req.user` no está en la lista.

### Ejercicio 7: Rutas y Composition Root

1. Crea `controllers/AuthController.js` (`register`, `login`, `me`) y `routes/authRoutes.js` con `POST /auth/register`, `POST /auth/login` y `GET /auth/me` (este último con `authenticate`).
2. Cambia las factories de routers para recibir los middlewares: `createBooksRouter(controller, auth)`, etc.
3. Protege así:
   - `GET /books` y `GET /books/:id`: públicos.
   - `POST` / `PUT` / `DELETE /books`: solo `admin`.
   - Todo `/users`: solo `admin`.
   - Todo `/loans`: solo autenticados.
4. En `container/container.js`: crea `hasher`, `tokens` y `auth`; ejecuta `seedAdmin` **después** de inicializar los DAOs; e inyéctalos donde corresponda.

### Ejercicio 8: Autorización por dueño en préstamos

Un `lector` solo puede operar sobre **sus propios** préstamos. Pasa `req.user` desde `LoansController` a los casos de uso como `actor` y aplica estas reglas **dentro del caso de uso**:

1. `createLoan`: `userId` pasa a ser opcional en el body; por defecto es el del actor. Un lector que mande el `userId` de otro recibe 403.
2. `getLoans`: un lector siempre ve solo los suyos; si pide el `userId` de otro, 403.
3. `getLoanById` y `returnLoan`: si el préstamo no es del lector, 403.
4. Pregunta para reflexionar (respóndela en un comentario en `createLoan.js`): ¿por qué esta regla va en el caso de uso y no en el router con `authorize`?

### Ejercicio 9: Verificación Funcional

1. Ejecuta el bloque `A1` a `A20` de `requests.http` (y `A21` a `A25` si hiciste el ejercicio 10) (necesitas la extensión REST Client) y verifica cada código de respuesta que indica el título.
2. Confirma que en **ninguna** respuesta aparece `passwordHash`.
3. Arranca con `PERSISTENCE_TYPE=memory` y repite con `PERSISTENCE_TYPE=sequelize`. El resultado debe ser idéntico.
4. Abre la base `database.sqlite` (por ejemplo con la extensión SQLite de VSCode) y comprueba que la columna `passwordHash` guarda un hash que empieza con `$2`, no la contraseña.
5. Pon `JWT_EXPIRES_IN=5s` en `.env`, haz login, espera 6 segundos y llama a `GET /auth/me`. Debe responder `TOKEN_EXPIRED`.
6. Modifica una letra del payload de un token válido y pruébalo. Debe responder `TOKEN_INVALID`.
7. Borra `JWT_SECRET` de `.env` y arranca. La aplicación debe negarse a iniciar.

### Ejercicio 10 (Opcional Avanzado): Endurecer el login

1. Haz que, cuando el email no existe, el login igual ejecute `hasher.compare` contra un hash falso, para que el tiempo de respuesta no revele si el usuario existe.
2. Agrega `express-rate-limit` a `POST /auth/login` (por ejemplo, 5 intentos por minuto por IP).
3. Agrega `PUT /auth/password` para que un usuario cambie su contraseña. Debe exigir la contraseña actual además de la nueva.
4. Pregunta para reflexionar: si un admin es eliminado, su token sigue siendo válido hasta que venza. ¿Qué podrías hacer en `authenticate` para evitarlo, y qué costo tiene?

¡Éxitos! La próxima clase salimos de nuestra API: consumimos una API externa con `fetch` y generamos un CSV descargable.
