import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";
import getBookDetails from "./getBookDetails.js";
import importBooks from "./importBooks.js";
import exportBooksCsv from "./exportBooksCsv.js";

/**
 * Factory de Casos de Uso para Libros.
 * Recibe el DAO de libros, el de préstamos (para validar el borrado), el bus de eventos y el catálogo externo, e inyecta la dependencia en cada caso de uso.
 * Devuelve un objeto con las funciones de uso listas para ser consumidas sin pasar el DAO en cada llamada.
 */
function makeBookUseCases(dao, loansDao, events, catalog, { importConcurrency }) {
  const createBookUseCase = (data) => createBook(data, dao, events);
  const getBooksUseCase = (filters) => getBooks(filters, dao, loansDao);

  return {
    getBooks: getBooksUseCase,
    getBookById: (id, options) => getBookById(id, dao, loansDao, options),
    createBook: createBookUseCase,
    updateBook: (id, changes) => updateBook(id, changes, dao, events),
    deleteBook: (id) => deleteBook(id, dao, loansDao),
    getBookDetails: (id) => getBookDetails(id, dao, catalog),
    importBooks: (params) => importBooks(params, dao, catalog, createBookUseCase, importConcurrency),
    exportBooksCsv: (params) => exportBooksCsv(params, getBooksUseCase, catalog),
  };
}

export default makeBookUseCases;
