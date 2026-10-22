import EVENTS from "../events/eventNames.js";

/**
 * Registra los listeners de alertas sobre el bus de eventos.
 * Recibe el bus y el notificador por inyección (desde el container).
 */
function registerAlertListeners(bus, notifier) {
  bus.on(EVENTS.BOOK_LOW_STOCK, async ({ id, titulo, stock }) => {
    try {
      await notifier.notify({
        subject: `Stock bajo: "${titulo}"`,
        body: `El libro "${titulo}" (id ${id}) quedó con ${stock} unidad(es) en stock.`,
      });
    } catch (err) {
      console.error(`[ALERTAS] Error al notificar ${EVENTS.BOOK_LOW_STOCK}:`, err.message);
    }
  });

  bus.on(EVENTS.USER_CREATED, async ({ id, nombre, email }) => {
    try {
      await notifier.notify({
        subject: `¡Bienvenido/a, ${nombre}!`,
        body: `Se registró el usuario ${nombre} <${email}> (id ${id}).`,
      });
    } catch (err) {
      console.error(`[ALERTAS] Error al notificar ${EVENTS.USER_CREATED}:`, err.message);
    }
  });
}

export default registerAlertListeners;