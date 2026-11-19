import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";
import getBookDetails from "./getBookDetails.js";
import importBooks from "./importBooks.js"; // ← NUEVO
import exportBooksCsv from "./exportBooksCsv.js"; // ← NUEVO

/**
 * Factory de Casos de Uso para Libros.
 * Recibe el DAO de libros, el de préstamos, el bus de eventos y el catálogo externo (Clase 12),
 * e inyecta la dependencia en cada caso de uso.
 */
function makeBookUseCases(dao, loansDao, events, catalog, { importConcurrency } = {}) {
  const createBookUseCase = (data) => createBook(data, dao, events);

  return {
    getBooks: (filters) => getBooks(filters, dao, loansDao),
    getBookById: (id, options) => getBookById(id, dao, loansDao, options),
    createBook: createBookUseCase,
    updateBook: (id, changes) => updateBook(id, changes, dao, events),
    deleteBook: (id) => deleteBook(id, dao, loansDao),
    getBookDetails: (id) => getBookDetails(id, dao, catalog),
    // ← NUEVO: la concurrencia llega por inyección, no se lee de config.js
    importBooks: (params) => importBooks(params, dao, catalog, createBookUseCase, importConcurrency),
        // ← NUEVO: reutiliza getBooks, así el CSV acepta los mismos filtros que el listado
    exportBooksCsv: (params) => exportBooksCsv(params, (filters) => getBooks(filters, dao, loansDao), catalog),
  };
}

export default makeBookUseCases;