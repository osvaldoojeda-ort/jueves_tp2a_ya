import AppError from "../../errors/AppError.js";
import { daysBetween } from "../../domain/businessDays.js";
import { isOverdue, withStatus } from "../../domain/loanStatus.js";

/**
 * Caso de Uso: Devolver un libro prestado (repone el stock).
 * Reglas de negocio: el préstamo debe existir y no estar ya devuelto.
 * Regla de acceso: un lector solo puede devolver sus propios préstamos.
 * Clase 13: la fecha de devolución la da el reloj inyectado, y la respuesta informa si se devolvió con atraso
 * (un préstamo vencido SÍ se puede devolver: es justamente lo que queremos que pase).
 */
async function returnLoan(id, actor, { loansDao, clock }) {
  const loan = await loansDao.getById(id);
  if (!loan) {
    throw new AppError("LOAN_NOT_FOUND", "No existe un préstamo con ese id", 404);
  }
  if (actor.rol !== "admin" && loan.userId !== actor.id) {
    throw new AppError("FORBIDDEN", "No tenés permiso para devolver este préstamo", 403);
  }
  if (loan.fechaDevolucion) {
    throw new AppError("ALREADY_RETURNED", "Ese préstamo ya fue devuelto", 409);
  }

  const today = clock.today();
  const returned = await loansDao.giveBack(id, clock.now());
  if (!returned) {
    // Otro pedido lo devolvió justo antes que este
    throw new AppError("ALREADY_RETURNED", "Ese préstamo ya fue devuelto", 409);
  }

  const atrasoAlDevolver = isOverdue(loan, today) ? daysBetween(loan.fechaVencimiento, today) : 0;
  return { ...withStatus(returned, today), atrasoAlDevolver };
}

export default returnLoan;
