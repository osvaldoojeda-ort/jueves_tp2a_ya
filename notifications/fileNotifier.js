import { appendFile } from "node:fs/promises";
import { NOTIFICATIONS_LOG_PATH } from "../config/config.js";

/**
 * Notificador a archivo (notifications.log).
 * Tiene la misma firma que consoleNotifier: el listener de alertas depende solo del contrato
 * notify({ subject, body }), por eso no necesita cambiar al pasar de un notificador a otro.
 *
 * Clase 15 (checklist): antes leía process.env.NOTIFICATIONS_LOG_PATH acá mismo. Era una variable "fantasma":
 * funcionaba, pero no estaba en config.js, ni en .env.example, ni en el README. Nadie podía saber que existía.
 */
const LOG_PATH = NOTIFICATIONS_LOG_PATH;

const fileNotifier = {
  async notify({ subject, body }) {
    const line = `${new Date().toISOString()} | ${subject} | ${body}\n`;
    await appendFile(LOG_PATH, line);
  },
};

export default fileNotifier;
