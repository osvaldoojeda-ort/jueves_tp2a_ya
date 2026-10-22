import { appendFile } from "node:fs/promises";

/**
 * Notificador a archivo (notifications.log).
 * Tiene la misma firma que consoleNotifier: el listener de alertas depende solo del contrato
 * notify({ subject, body }), por eso no necesita cambiar al pasar de un notificador a otro.
 */
const LOG_PATH = process.env.NOTIFICATIONS_LOG_PATH || "notifications.log";

const fileNotifier = {
  async notify({ subject, body }) {
    const line = `${new Date().toISOString()} | ${subject} | ${body}\n`;
    await appendFile(LOG_PATH, line);
  },
};

export default fileNotifier;
