import createEventBus from "./events/eventBus.js";
import registerAlertListeners from "./alerts/registerAlertListeners.js";
import consoleNotifier from "./notifications/consoleNotifier.js";
import makeBookUseCases from "./useCases/books/makeBookUseCases.js";
import { BooksMemoryDao } from "./dao/books/BooksMemoryDao.js";
import usersMemoryDao from "./dao/users/UsersMemoryDao.js";

const bus = createEventBus();
registerAlertListeners(bus, consoleNotifier);
const uc = makeBookUseCases(new BooksMemoryDao(), usersMemoryDao, bus);

const paso = async (msg, fn) => { console.log(`\n--- ${msg}`); await fn(); await new Promise(r => setTimeout(r, 10)); };

await paso("1) stock 10 → NO notifica", () => uc.updateBook(1, { stock: 10 }));
await paso("2) stock 2 → SÍ notifica", () => uc.updateBook(1, { stock: 2 }));
await paso("3) stock 1 → SÍ notifica", () => uc.updateBook(1, { stock: 1 }));
await paso("4) crear con stock 0 → SÍ notifica", () => uc.createBook({ titulo: "Rayuela", autor: "Cortázar", stock: 0 }));
await paso("5) solo título → NO notifica", () => uc.updateBook(1, { titulo: "El Principito (ed. nueva)" }));
await paso("6) libro inexistente → NO notifica", () => uc.updateBook(999, { stock: 0 }));