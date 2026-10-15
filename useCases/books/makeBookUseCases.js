import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";

/**
 * Factory de Casos de Uso para Libros.
 * Recibe el DAO de libros y el de usuarios (para validar userId) e inyecta la dependencia en cada caso de uso.
 * Devuelve un objeto con las funciones de uso listas para ser consumidas sin pasar el DAO en cada llamada.
 */
function makeBookUseCases(dao, usersDao) {
  return {
    getBooks: (filters) => getBooks(filters, dao),
    getBookById: (id) => getBookById(id, dao),
    createBook: (data) => createBook(data, dao, usersDao),
    updateBook: (id, changes) => updateBook(id, changes, dao, usersDao),
    deleteBook: (id) => deleteBook(id, dao),
  };
}

export default makeBookUseCases;
