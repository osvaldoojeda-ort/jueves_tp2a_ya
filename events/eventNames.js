/**
 * Nombres de eventos de la aplicación.
 * Son el contrato entre quien emite y quien escucha: se centralizan para no depender de strings sueltos.
 * Convención: "entidad.hecho" (algo que YA ocurrió, no una orden).
 */
const EVENTS = {
  BOOK_LOW_STOCK: "book.lowStock",
  USER_CREATED: "user.created",
};

export default EVENTS;
