import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";

/**
 * Factory de Casos de Uso para Libros.
 * Recibe el DAO de libros, el de préstamos (para validar el borrado) y el bus de eventos, e inyecta la dependencia en cada caso de uso.
 * Devuelve un objeto con las funciones de uso listas para ser consumidas sin pasar el DAO en cada llamada.
 */
function makeBookUseCases(dao, loansDao, events) {
  return {
    getBooks: (filters) => getBooks(filters, dao, loansDao),
    getBookById: (id, options) => getBookById(id, dao, loansDao, options),
    createBook: (data) => createBook(data, dao, events),
    updateBook: (id, changes) => updateBook(id, changes, dao, events),
    deleteBook: (id) => deleteBook(id, dao, loansDao),
  };
}

export default makeBookUseCases;
