import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";
import getBookDetails from "./getBookDetails.js"; // ← NUEVO

/**
 * Factory de Casos de Uso para Libros.
 * Recibe el DAO de libros, el de préstamos, el bus de eventos y el catálogo externo (Clase 12),
 * e inyecta la dependencia en cada caso de uso.
 */
function makeBookUseCases(dao, loansDao, events, catalog, { importConcurrency } = {}) {
  return {
    getBooks: (filters) => getBooks(filters, dao, loansDao),
    getBookById: (id, options) => getBookById(id, dao, loansDao, options),
    createBook: (data) => createBook(data, dao, events),
    updateBook: (id, changes) => updateBook(id, changes, dao, events),
    deleteBook: (id) => deleteBook(id, dao, loansDao),
    getBookDetails: (id) => getBookDetails(id, dao, catalog), // ← NUEVO
  };
}

export default makeBookUseCases;