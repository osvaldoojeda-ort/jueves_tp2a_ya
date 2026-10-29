import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Devolver un libro prestado (repone el stock).
 * Reglas de negocio: el préstamo debe existir y no estar ya devuelto.
 * Regla de acceso: un lector solo puede devolver sus propios préstamos.
 */
async function returnLoan(id, actor, dao) {
  const loan = await dao.getById(id);
  if (!loan) {
    throw new AppError("LOAN_NOT_FOUND", "No existe un préstamo con ese id", 404);
  }
  if (actor.rol !== "admin" && loan.userId !== actor.id) {
    throw new AppError("FORBIDDEN", "No tenés permiso para devolver este préstamo", 403);
  }
  if (loan.fechaDevolucion) {
    throw new AppError("ALREADY_RETURNED", "Ese préstamo ya fue devuelto", 409);
  }

  const returned = await dao.giveBack(id);
  if (!returned) {
    // Otro pedido lo devolvió justo antes que este
    throw new AppError("ALREADY_RETURNED", "Ese préstamo ya fue devuelto", 409);
  }
  return returned;
}

export default returnLoan;
