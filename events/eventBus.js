import { EventEmitter } from "node:events";

/**
 * Crea el bus de eventos interno (en memoria, un solo proceso).
 * Se instancia una sola vez en el Composition Root y se inyecta donde haga falta.
 */
function createEventBus() {
  return new EventEmitter();
}

export default createEventBus;
