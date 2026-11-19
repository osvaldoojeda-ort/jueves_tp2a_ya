import AppError from "../../errors/AppError.js";
import { isOverdue } from "../../domain/loanStatus.js";

/**
 * Regla compartida por R3 (createLoan) y R6 (renewLoan): si entre `loans` hay alguno vencido al día `today`,
 * corta con 409 USER_HAS_OVERDUE_LOANS y en `details` lista cuáles son (el cliente sabe qué tiene que devolver).
 * Clase 14 - Ej. 10.3: salió del REFACTOR de TDD. Al implementar R6 en verde, el bloque quedó copiado casi igual
 * al de createLoan; con los tests en verde se pudo extraer sin miedo. Solo cambia el final del mensaje.
 */
function assertNoOverdueLoans(loans, today, accion) {
  const overdue = loans.filter((loan) => isOverdue(loan, today));
  if (overdue.length > 0) {
    throw new AppError(
      "USER_HAS_OVERDUE_LOANS",
      `El usuario tiene préstamos vencidos: debe devolverlos antes de ${accion}`,
      409,
      overdue.map((loan) => ({ loanId: loan.id, bookId: loan.bookId, fechaVencimiento: loan.fechaVencimiento }))
    );
  }
}

export default assertNoOverdueLoans;
