/**
 * Notificador por consola.
 * Contrato: async notify({ subject, body })
 */
const consoleNotifier = {
  async notify({ subject, body }) {
    console.log(`[NOTIFICACIÓN] ${subject} - ${body}`);
  },
};

export default consoleNotifier;