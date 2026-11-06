import getLoans from "./getLoans.js";
import getLoanById from "./getLoanById.js";
import createLoan from "./createLoan.js";
import returnLoan from "./returnLoan.js";
import renewLoan from "./renewLoan.js";

/**
 * Factory de Casos de Uso para Préstamos.
 * Necesita los DAOs de préstamos, libros (stock) y usuarios (validación) y el bus de eventos.
 * Clase 13: además el reloj (`clock`), el gateway de feriados (`holidays`) y los números de las reglas
 * (`loanRules`: maxActive, businessDays, maxRenewals), y el umbral de stock bajo (`lowStockThreshold`). Todo inyectado: ningún caso de uso lee config ni la hora real.
 */
function makeLoanUseCases({ loansDao, booksDao, usersDao, events, clock, holidays, loanRules, lowStockThreshold }) {
  const deps = { loansDao, booksDao, usersDao, events, clock, holidays, loanRules, lowStockThreshold };
  return {
    getLoans: (filters, actor) => getLoans(filters, actor, deps),
    getLoanById: (id, actor) => getLoanById(id, actor, deps),
    createLoan: (data, actor) => createLoan(data, actor, deps),
    returnLoan: (id, actor) => returnLoan(id, actor, deps),
    renewLoan: (id, actor) => renewLoan(id, actor, deps),
  };
}

export default makeLoanUseCases;
