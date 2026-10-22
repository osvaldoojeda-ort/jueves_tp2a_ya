import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Devolver un libro prestado (repone el stock).
 * Reglas de negocio: el préstamo debe existir y no estar ya devuelto.
 */
async function returnLoan(id, dao) {
  const loan = await dao.getById(id);
  if (!loan) {
    throw new AppError("LOAN_NOT_FOUND", "No existe un préstamo con ese id", 404);
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
