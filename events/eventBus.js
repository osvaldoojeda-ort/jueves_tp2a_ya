import { EventEmitter } from "node:events";

function createEventBus() {
  return new EventEmitter();
}

export default createEventBus;