import getLoans from "./getLoans.js";
import getLoanById from "./getLoanById.js";
import createLoan from "./createLoan.js";
import returnLoan from "./returnLoan.js";

/**
 * Factory de Casos de Uso para Préstamos.
 * Necesita los DAOs de préstamos, libros (stock) y usuarios (validación), y el bus de eventos.
 * Todos reciben el `actor` (req.user) para aplicar las reglas de dueño (Ej. 8).
 */
function makeLoanUseCases({ loansDao, booksDao, usersDao, events }) {
  return {
    getLoans: (filters, actor) => getLoans(filters, actor, loansDao), // ← CAMBIÓ
    getLoanById: (id, actor) => getLoanById(id, actor, loansDao), // ← CAMBIÓ
    createLoan: (data, actor) => createLoan(data, actor, loansDao, booksDao, usersDao, events), // ← CAMBIÓ
    returnLoan: (id, actor) => returnLoan(id, actor, loansDao), // ← CAMBIÓ
  };
}

export default makeLoanUseCases;
