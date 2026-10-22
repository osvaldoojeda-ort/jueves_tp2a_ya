/**
 * Notificador por consola.
 * Contrato: notify({ subject, body }). Cualquier otro notificador debe respetar la misma firma.
 */
const consoleNotifier = {
  async notify({ subject, body }) {
    console.log(`[NOTIFICACIÓN] ${subject} — ${body}`);
  },
};

export default consoleNotifier;
