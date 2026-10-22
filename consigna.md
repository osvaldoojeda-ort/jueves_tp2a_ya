# Clase 10 — Consigna de Práctica (Tarea Integradora)

En esta clase viste cómo **desacoplar una regla de negocio de sus efectos secundarios** usando `EventEmitter`: el caso de uso **emite un evento** y un módulo aparte **reacciona** enviando una notificación. Todo el cableado vive en el Composition Root (`container/container.js`).

El objetivo es que construyas un **módulo de alertas por stock bajo** sobre la API de la Clase 9, respetando la Arquitectura en Capas.

---

## Tarea Integrada: Alertas de Stock Bajo

Cuando el stock de un libro quede **igual o por debajo de un umbral**, el sistema debe generar una alerta y notificarla. La actualización del libro **no debe enterarse** de cómo ni por dónde se notifica.

Sigue estos pasos en orden:

### Ejercicio 1: Configuración y nombres de eventos
1. En `config/config.js` agrega `LOW_STOCK_THRESHOLD`, leído de `process.env.LOW_STOCK_THRESHOLD` con valor por defecto `2`, y expórtalo. Agrégalo también a `.env.example`.
2. Crea `events/eventNames.js` y exporta un objeto `EVENTS` con al menos `BOOK_LOW_STOCK: "book.lowStock"`.
3. Crea `events/eventBus.js` con una función `createEventBus()` que retorne una nueva instancia de `EventEmitter` (`node:events`).

### Ejercicio 2: Notificador (el efecto secundario)
1. Crea `notifications/consoleNotifier.js` que exporte un objeto con el método `async notify({ subject, body })`, el cual imprime la notificación por consola con un prefijo `[NOTIFICACIÓN]`.
2. Crea `notifications/fileNotifier.js` con **la misma firma**, pero que agregue cada notificación como una línea a un archivo `notifications.log` (usa `node:fs/promises`, `appendFile`). Agrega `notifications.log` al `.gitignore`.
3. Responde en un comentario al inicio de `fileNotifier.js`: ¿por qué el listener de alertas no necesita cambiar si pasamos de un notificador al otro?

### Ejercicio 3: Módulo de alertas (el listener)
1. Crea `alerts/registerAlertListeners.js` con la función `registerAlertListeners(bus, notifier)`.
2. Dentro, escucha `EVENTS.BOOK_LOW_STOCK` y llama a `notifier.notify` con un asunto y un cuerpo que incluyan el título del libro y el stock restante.
3. El listener **debe capturar sus propios errores** (`try/catch`) y registrarlos con `console.error` sin relanzarlos.

### Ejercicio 4: Emitir el evento desde el dominio
1. Modifica `usecases/books/makeBookUseCases.js` para que reciba un tercer parámetro: `events` (el bus), junto con `dao` y `usersDao`.
2. En `usecases/books/updateBook.js` recibe `events` y, **después** de actualizar con éxito, emite `EVENTS.BOOK_LOW_STOCK` si `stock <= LOW_STOCK_THRESHOLD`. El payload debe ser un objeto plano con `id`, `titulo` y `stock`.
3. Aplica la misma regla en `createBook.js` (un libro puede nacer con stock bajo).
4. Verifica que **no se emita** el evento si:
   - El libro no existe (`update` devolvió `null`).
   - El cambio no incluye `stock` (por ejemplo, solo se modificó el título) y el libro ya estaba con stock bajo.
5. Pregunta para reflexionar (respóndela en un comentario en `updateBook.js`): ¿por qué leer el umbral desde `config` dentro del caso de uso es aceptable, pero instanciar el notificador ahí **no** lo es?

### Ejercicio 5: Inyección en el Contenedor
Ve al archivo `container/container.js`.
1. Crea el bus con `createEventBus()`.
2. Elige el notificador (`consoleNotifier` o `fileNotifier`) según una variable de entorno `NOTIFIER_TYPE` (`console` por defecto, `file` para archivo). Puedes resolverlo con una pequeña factory `notifications/notifierFactory.js`, igual que `daoFactory`.
3. Registra los listeners con `registerAlertListeners(events, notifier)`.
4. Pasa `events` a `makeBookUseCases(booksDao, usersDao, events)`.

### Ejercicio 6: Verificación Funcional
1. Agrega a `requests.http` un bloque con peticiones que:
   - Actualicen un libro con stock **mayor** al umbral (no debe haber notificación).
   - Actualicen un libro con stock **igual** al umbral (debe haber notificación).
   - Actualicen un libro con stock **menor** al umbral (debe haber notificación).
   - Creen un libro con stock bajo (debe haber notificación).
   - Actualicen solo el `titulo` de un libro con stock bajo (**no** debe haber notificación).
2. Arranca la aplicación con `PERSISTENCE_TYPE=memory` y verifica los avisos en la consola.
3. Arranca con `PERSISTENCE_TYPE=sequelize` y `NOTIFIER_TYPE=file` y verifica que se escriba `notifications.log`.
4. Comprueba que, si el notificador lanza un error (haz que `fileNotifier` falle a propósito, por ejemplo con una ruta inválida), la petición `PUT /books/:id` **igual responde 200** y el libro queda actualizado.

### Ejercicio 7 (Opcional Avanzado): Segundo evento
1. Agrega `USER_CREATED: "user.created"` a `EVENTS`.
2. Emite el evento desde `usecases/users/createUser.js` (inyectando `events` en `makeUserUseCases`) con un payload que contenga `id`, `nombre` y `email`.
3. Registra un segundo listener que envíe una notificación de bienvenida por el mismo `notifier`.
4. Pregunta para reflexionar: ¿qué cambió en `updateBook` o en el notificador para soportar este nuevo evento? (Respuesta esperada: nada.)

¡Éxitos! La próxima clase avanzamos hacia Seguridad (JWT).
