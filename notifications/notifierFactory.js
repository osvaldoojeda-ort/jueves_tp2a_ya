import { NOTIFIER_TYPE } from "../config/config.js";
import consoleNotifier from "./consoleNotifier.js";
import fileNotifier from "./fileNotifier.js";

/**
 * Factory de Notificadores.
 * Retorna el notificador correcto dependiendo de la variable de entorno NOTIFIER_TYPE.
 */
function getNotifier() {
  if (NOTIFIER_TYPE === "file") {
    console.log("[Notificaciones] Usando archivo (notifications.log)");
    return fileNotifier;
  } else {
    console.log("[Notificaciones] Usando consola");
    return consoleNotifier;
  }
}

export { getNotifier };