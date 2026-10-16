# Clase 10 — Eventos con EventEmitter: desacoplar la regla de negocio del efecto secundario

## Objetivos de la clase

- Entender qué es un **evento**, y en particular un **evento de dominio** y por qué sirve para separar una regla de negocio de sus **efectos secundarios** (avisos, mails, logs, auditoría).
- Usar **`EventEmitter`** de Node.js (`node:events`) como bus de eventos interno.
- Aplicar la **Inversión de Dependencias** a las notificaciones: el caso de uso emite un evento y no conoce a quien lo escucha.
- Construir un **módulo de alertas** (ej. stock bajo) que dispara una **notificación** al ocurrir un evento.
- Registrar los listeners en el **Composition Root** (`container/container.js`).

---

## 1. ¿Qué es un evento?

Un **evento** es el aviso de que **algo ya ocurrió** en el sistema. No es una orden ni una función que se llama: es una señal que dice "esto pasó" para que, quien tenga interés, reaccione.

### Una analogía cotidiana

Pensá en el timbre de una casa:

- Alguien toca el timbre (**se emite el evento**).
- El que toca **no sabe** quién está adentro, ni qué va a hacer cada uno.
- Adentro, una persona abre la puerta, otra mira por la ventana y otra ni se entera (**los listeners reaccionan**, cada uno a su manera).
- Si no hay nadie en casa, el timbre suena igual y nada se rompe.

### Los tres roles

| Rol | Qué hace | En nuestra API |
|---|---|---|
| **Emisor** | Anuncia que pasó algo. No sabe quién escucha | El caso de uso `updateBook` |
| **Evento** | El aviso: tiene un nombre y datos (payload) | `"book.lowStock"` con `{ id, titulo, stock }` |
| **Listener** (oyente) | Se suscribe a un evento y decide qué hacer | El módulo de alertas |

### Evento vs. llamada a función

| | Llamada a función | Evento |
|---|---|---|
| Quién decide qué pasa | El que llama | El que escucha |
| ¿Conoce al destinatario? | Sí, lo importa y lo invoca | No, solo conoce el nombre del evento |
| Agregar otra reacción | Hay que modificar al que llama | Se agrega otro listener |
| ¿Se puede ignorar? | No | Sí: si nadie escucha, no pasa nada |

### ¿Se parece a los eventos del front?

Sí: **el concepto es el mismo**. Si ya usaste `addEventListener` en el navegador, ya conocés la idea.

```js
// Front (DOM)
boton.addEventListener("click", (e) => { ... });

// Back (Node)
bus.on("book.lowStock", (payload) => { ... });
```

Lo que comparten: se **suscribe** un callback (`addEventListener` / `on`), se puede **dejar de escuchar** (`removeEventListener` / `off`), puede haber **varios listeners** por evento y **el emisor no sabe quién escucha**.

| | Front (DOM) | Back (`EventEmitter`) |
|---|---|---|
| Quién lo dispara | El usuario o el navegador (clic, scroll, `submit`) | Tu propio código (`emit`) |
| Qué representa | Una interacción con la interfaz | Un hecho del negocio (stock bajo, usuario creado) |
| Propagación | *Bubbling* y *capturing* por el árbol de elementos | No hay árbol: va directo a sus listeners |
| Cancelar | `preventDefault()`, `stopPropagation()` | No existe |
| Eventos incorporados | Cientos (`click`, `keydown`, `load`...) | Casi ninguno: los definís vos |
| Alcance | Una pestaña del navegador | Un solo proceso de Node |

Dato curioso: Node usa `EventEmitter` por dentro. `http.Server`, los *streams* y `process` son emisores de eventos (por ejemplo `req.on("data", ...)` o `server.on("error", ...)`), y el DOM tiene su equivalente de `emit`: `dispatchEvent(new CustomEvent(...))`.

### Cómo se nombra un evento

Se nombra como **un hecho**, no como una orden:

- Bien: `book.lowStock`, `user.created` ("el stock quedó bajo", "se creó un usuario").
- Mal: `book.sendMail`, `user.saveToLog` ("mandá un mail", "guardá un log"). Eso ya decide el efecto desde el emisor y vuelve a acoplar.

### Un evento, en una línea de código

```js
bus.emit("book.lowStock", { id: 1, titulo: "El principito", stock: 1 });
```

Esa línea **no envía ningún mail ni imprime nada**. Solo anuncia el hecho. Qué se hace con él lo deciden los listeners, en otro lugar del código.

---

## 2. El problema: la regla de negocio hace demasiado

Supongamos que queremos avisar cuando el stock de un libro queda bajo. La primera idea suele ser meterlo dentro del caso de uso:

```js
// usecases/books/updateBook.js  (versión acoplada)
async function updateBook(id, changes, dao, usersDao, mailer, logger) {
  const updated = await dao.update(id, changes);

  if (updated.stock <= 2) {
    await mailer.send("admin@biblioteca.com", `Stock bajo: ${updated.titulo}`);
    logger.warn(`Stock bajo: ${updated.titulo}`);
  }
  return updated;
}
```

Problemas:

- **El caso de uso conoce todos los efectos**: mail, log, y mañana push, Slack, auditoría...
- **Cada efecto nuevo obliga a tocar la regla** (viola el Principio Abierto/Cerrado).
- **Es difícil de testear**: para probar `updateBook` hay que inyectar un mailer y un logger falsos.
- **Si el mail falla, falla la actualización**, aunque el libro ya se haya guardado bien.

---

## 3. La idea: el caso de uso anuncia lo que pasó

En lugar de *hacer* el aviso, el caso de uso **anuncia un hecho**: "un libro quedó con stock bajo". Quién reacciona a eso es problema de otro.

```js
// usecases/books/updateBook.js  (versión desacoplada)
async function updateBook(id, changes, dao, usersDao, events) {
  const updated = await dao.update(id, changes);

  if (updated && changes.stock !== undefined && updated.stock <= LOW_STOCK_THRESHOLD) {
    events.emit("book.lowStock", { id: updated.id, titulo: updated.titulo, stock: updated.stock });
  }
  return updated;
}
```

El caso de uso solo depende de un **emisor de eventos** inyectado. No sabe si hay 0, 1 o 10 oyentes.

| | Acoplado | Con eventos |
|---|---|---|
| Quién sabe del mail | El caso de uso | Un listener aparte |
| Agregar un efecto nuevo | Editar la regla | Registrar otro listener |
| Testear la regla | Con mocks de todo | Alcanza con ver que se emitió el evento |

---

## 4. `EventEmitter` de Node.js

Viene incluido en Node (`node:events`), no requiere instalar nada.

```js
import { EventEmitter } from "node:events";

const bus = new EventEmitter();

// Suscribirse
bus.on("book.lowStock", (payload) => {
  console.log(`[ALERTA] Stock bajo en "${payload.titulo}" (${payload.stock})`);
});

// Emitir
bus.emit("book.lowStock", { id: 1, titulo: "El principito", stock: 1 });
```

### Métodos principales

| Método | Qué hace |
|---|---|
| `on(evento, fn)` | Registra un listener que se ejecuta **cada vez** que se emite |
| `once(evento, fn)` | Registra un listener que se ejecuta **una sola vez** |
| `off(evento, fn)` | Quita un listener |
| `emit(evento, ...args)` | Dispara el evento; devuelve `true` si había listeners |

### Cosas que hay que saber (y que sorprenden)

1. **`emit` es síncrono.** Los listeners se ejecutan uno tras otro, en el momento del `emit`, antes de que `emit` devuelva. Que los listeners sean `async` no hace que `emit` los espere.
2. **Un listener que lanza un error rompe el `emit`.** Si el listener es síncrono y falla, la excepción sube hasta quien emitió. Por eso los listeners deben capturar sus propios errores.
3. **Un listener `async` que falla** genera un *unhandled rejection*, no una excepción en `emit`. Hay que hacer `try/catch` dentro del listener.
4. **El evento especial `"error"`**: si se emite `"error"` y nadie lo escucha, Node lanza la excepción y puede tirar el proceso.
5. **Es en memoria y dentro de un solo proceso.** Si el servidor se cae, los eventos pendientes se pierden. No reemplaza a una cola de mensajes (RabbitMQ, SQS, Kafka).
6. **Aviso de más de 10 listeners** por evento (`MaxListenersExceededWarning`): suele indicar que se está registrando el mismo listener en cada request.

---

## 5. Diseño: bus de eventos, eventos y listeners

### 5.1. Bus único, inyectado

Se crea **una sola instancia** en el Composition Root y se inyecta donde haga falta. No se importa un bus global desde los casos de uso (sería una dependencia oculta).

```js
// events/eventBus.js
import { EventEmitter } from "node:events";

function createEventBus() {
  return new EventEmitter();
}

export default createEventBus;
```

### 5.2. Nombres de eventos

Los nombres son parte del contrato entre el emisor y los oyentes. Se centralizan en un solo archivo para no depender de strings sueltos:

```js
// events/eventNames.js
const EVENTS = {
  BOOK_LOW_STOCK: "book.lowStock",
};

export default EVENTS;
```

Convención: `entidad.hecho` en pasado o estado (`book.lowStock`, `user.created`). Un evento **describe algo que ya ocurrió**, no una orden.

### 5.3. Payload

Se envía un **objeto plano con lo mínimo necesario** (ids y datos útiles para el listener), no instancias de modelos ni el DAO.

---

## 6. El módulo de alertas y la notificación

Separamos dos responsabilidades:

- **Alerta**: *decide* qué hacer cuando ocurre un evento (listener).
- **Notificador**: *entrega* el mensaje por algún canal (consola, mail, Slack...).

```
 updateBook ──emit──▶ "book.lowStock" ──▶ alertListener ──▶ notifier.notify()
 (regla de negocio)       (evento)          (módulo alertas)   (efecto secundario)
```

### El notificador es una interfaz, igual que el DAO

Aplicamos de nuevo la idea de la Clase 9: el listener depende de un contrato (`notify(message)`), y la implementación concreta se elige en el contenedor.

```js
// notifications/consoleNotifier.js
const consoleNotifier = {
  async notify({ subject, body }) {
    console.log(`[NOTIFICACIÓN] ${subject} — ${body}`);
  },
};

export default consoleNotifier;
```

Mañana puede existir `emailNotifier` o `slackNotifier` con la **misma firma**, sin tocar el listener ni la regla.

### El listener

```js
// alerts/registerAlertListeners.js
import EVENTS from "../events/eventNames.js";

function registerAlertListeners(bus, notifier) {
  bus.on(EVENTS.BOOK_LOW_STOCK, async ({ titulo, stock }) => {
    try {
      await notifier.notify({
        subject: "Stock bajo",
        body: `Quedan ${stock} unidades de "${titulo}"`,
      });
    } catch (err) {
      // Un fallo en la notificación NO debe afectar al caso de uso que emitió el evento
      console.error("[alertas] No se pudo notificar:", err.message);
    }
  });
}

export default registerAlertListeners;
```

---

## 7. Cableado en el Composition Root

Todo se conecta en `container/container.js`, el único lugar que conoce las piezas concretas:

```js
// container/container.js
const events = createEventBus();
const notifier = consoleNotifier;

registerAlertListeners(events, notifier);          // quién escucha

const bookUseCases = makeBookUseCases(booksDao, usersDao, events); // quién emite
```

Idea clave: **emisor y oyente no se conocen**. El único que sabe que existen los dos es el contenedor.

---

## 8. Regla de negocio vs. efecto secundario

| | Regla de negocio | Efecto secundario |
|---|---|---|
| Ejemplo | "El email no puede repetirse", "el stock no puede ser negativo" | Enviar un mail, escribir un log, avisar al admin |
| Si falla | La operación **debe** abortarse | La operación principal **no** debería fallar |
| Dónde vive | Caso de uso | Listener |
| ¿Puede ir en un evento? | No: hay que validar antes | Sí |

Regla práctica: **si el resultado puede cambiar si el efecto falla o no se ejecuta, no es un efecto secundario, es parte de la regla** y no va por evento.

---

## 9. Cuándo conviene (y cuándo no) usar eventos

**Conviene** cuando:
- Hay varios efectos que dependen del mismo hecho.
- El efecto es "avisar" o "registrar" y no condiciona el resultado.
- Se espera que aparezcan más reacciones con el tiempo.

**No conviene** cuando:
- Hay un solo efecto y es parte inseparable de la operación.
- Necesitás saber si el efecto funcionó para responder al cliente.
- Necesitás garantías de entrega (si se cae el proceso, el evento se pierde): ahí se usa una cola persistente.

---

## Cierre

- Los casos de uso **emiten hechos**; los listeners **reaccionan**.
- `EventEmitter` es **síncrono, en memoria y de un solo proceso**: ideal para desacoplar dentro de la app, no para mensajería entre servicios.
- Los listeners deben **atrapar sus propios errores**.
- El **notificador** sigue el mismo patrón que el DAO: un contrato y una implementación intercambiable elegida en el contenedor.
- Todo el cableado vive en `container/container.js`.
