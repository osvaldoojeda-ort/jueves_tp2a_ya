import AppError from "../../errors/AppError.js";
import { isOverdue, withStatus } from "../../domain/loanStatus.js";
import calculateDueDate from "./calculateDueDate.js";

/**
 * Caso de Uso: Renovar un préstamo (regla R4).
 * Una regla de negocio suele ser una CADENA de condiciones, cada una con su propio `code`,
 * en el orden de siempre: existencia → permiso → estado → regla.
 *  - LOAN_NOT_FOUND (404)        el préstamo no existe
 *  - FORBIDDEN (403)             un lector solo renueva los suyos
 *  - ALREADY_RETURNED (409)      no se renueva lo que ya se devolvió
 *  - LOAN_OVERDUE (409)          un préstamo vencido no se renueva: hay que devolverlo
 *  - RENEWAL_LIMIT_REACHED (409) se renueva como máximo `maxRenewals` veces
 * El nuevo vencimiento se cuenta desde el vencimiento ACTUAL (no desde hoy): renovar antes no "pierde" días.
 */
async function renewLoan(id, actor, { loansDao, clock, holidays, loanRules }) {
  const loan = await loansDao.getById(id);
  if (!loan) {
    throw new AppError("LOAN_NOT_FOUND", "No existe un préstamo con ese id", 404);
  }
  if (actor.rol !== "admin" && loan.userId !== actor.id) {
    throw new AppError("FORBIDDEN", "No tenés permiso para renovar este préstamo", 403);
  }
  if (loan.fechaDevolucion) {
    throw new AppError("ALREADY_RETURNED", "Ese préstamo ya fue devuelto", 409);
  }

  const today = clock.today();
  if (isOverdue(loan, today)) {
    throw new AppError("LOAN_OVERDUE", "El préstamo está vencido: no se puede renovar, hay que devolverlo", 409);
  }
  if (loan.renovaciones >= loanRules.maxRenewals) {
    throw new AppError(
      "RENEWAL_LIMIT_REACHED",
      `Un préstamo se puede renovar como máximo ${loanRules.maxRenewals} ${loanRules.maxRenewals === 1 ? "vez" : "veces"}`,
      409
    );
  }

  const { fechaVencimiento, holidaysAvailable } = await calculateDueDate({
    fromDate: loan.fechaVencimiento,
    businessDays: loanRules.businessDays,
    holidays,
  });

  // UPDATE condicional: si otro pedido lo devolvió o lo renovó mientras tanto, no pisa nada
  const renewed = await loansDao.renew(id, { fechaVencimiento, renovacionesPrevias: loan.renovaciones });
  if (!renewed) {
    throw new AppError("LOAN_CHANGED", "El préstamo cambió mientras se procesaba el pedido: volvé a intentarlo", 409);
  }

  return { ...withStatus(renewed, today), holidaysAvailable };
}

export default renewLoan;
