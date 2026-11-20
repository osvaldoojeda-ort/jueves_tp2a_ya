import { NOTIFIER_TYPE, NOTIFICATIONS_LOG_PATH } from "../config/config.js";
import consoleNotifier from "./consoleNotifier.js";
import fileNotifier from "./fileNotifier.js";

/**
 * Factory de notificadores (equivalente a daoFactory).
 * Devuelve la implementación según NOTIFIER_TYPE.
 */
function getNotifier() {
  if (NOTIFIER_TYPE === "file") {
    console.log(`[Notificaciones] Usando archivo (${NOTIFICATIONS_LOG_PATH})`);
    return fileNotifier;
  }
  console.log("[Notificaciones] Usando consola");
  return consoleNotifier;
}

export { getNotifier };
