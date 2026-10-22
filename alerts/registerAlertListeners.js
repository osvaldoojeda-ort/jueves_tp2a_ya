import EVENTS from "../events/eventNames.js";

/**
 * Módulo de alertas: decide qué hacer cuando ocurre un evento.
 * No conoce al emisor (los casos de uso) ni el canal concreto (el notifier se inyecta).
 */
function registerAlertListeners(bus, notifier) {
  bus.on(EVENTS.BOOK_LOW_STOCK, async ({ titulo, stock }) => {
    try {
      await notifier.notify({
        subject: "Stock bajo",
        body: `Quedan ${stock} unidades de "${titulo}"`,
      });
    } catch (err) {
      // Un fallo en la notificación NO debe afectar al caso de uso que emitió el evento
      console.error("[alertas] No se pudo notificar:", err.message);
    }
  });

  // Segundo listener: bienvenida al crear un usuario (mismo notificador, otro evento)
  bus.on(EVENTS.USER_CREATED, async ({ nombre, email }) => {
    try {
      await notifier.notify({
        subject: "Bienvenida",
        body: `Se creó el usuario ${nombre} <${email}>`,
      });
    } catch (err) {
      console.error("[alertas] No se pudo notificar:", err.message);
    }
  });
}

export default registerAlertListeners;
