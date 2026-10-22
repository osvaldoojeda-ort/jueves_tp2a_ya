import getLoans from "./getLoans.js";
import getLoanById from "./getLoanById.js";
import createLoan from "./createLoan.js";
import returnLoan from "./returnLoan.js";

/**
 * Factory de Casos de Uso para Préstamos.
 * Necesita los DAOs de préstamos, libros (stock) y usuarios (validación), y el bus de eventos.
 */
function makeLoanUseCases({ loansDao, booksDao, usersDao, events }) {
  return {
    getLoans: (filters) => getLoans(filters, loansDao),
    getLoanById: (id) => getLoanById(id, loansDao),
    createLoan: (data) => createLoan(data, loansDao, booksDao, usersDao, events),
    returnLoan: (id) => returnLoan(id, loansDao),
  };
}

export default makeLoanUseCases;
