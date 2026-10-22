/*
* PREGUNTA: ¿Por qué el listener de alertas no necesita cambiar si pasamos de un notificador al otro?
*
* RESPUESTA: (Porque por fuera son iguales, pero por dentro hacen cosas distintas. El listener de alertas no necesita saber cómo se envía la notificación, solo necesita llamar al método notify del notificador que se le pase. Esto permite cambiar el notificador sin afectar al listener, ya que ambos notificadores implementan la misma interfaz de notificación.)
*/
import { appendFile } from "node:fs/promises";

const LOG_FILE = "notifications.log"; 

/**
 * Notificador por archivo.
 * Agrega cada notificación como una línea nueva en notifications.log.
 */
const fileNotifier = {
  async notify({ subject, body }) {
    const line = `${new Date().toISOString()} | ${subject} | ${body}\n`;
    await appendFile(LOG_FILE, line, "utf8");
  },
};

export default fileNotifier;