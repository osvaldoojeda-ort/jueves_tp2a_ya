import getBooks from "./getBooks.js";
import getBookById from "./getBookById.js";
import createBook from "./createBook.js";
import updateBook from "./updateBook.js";
import deleteBook from "./deleteBook.js";

function makeBookUseCases(dao) {
  const log = (name) => console.log(`[UseCase] Executing ${name}...`);

  return {
    getBooks: (filters) => {
      log("getBooks");
      return getBooks(filters, dao);
    },
    getBookById: (id) => {
      log("getBookById");
      return getBookById(id, dao);
    },
    createBook: (data) => {
      log("createBook");
      return createBook(data, dao);
    },
    updateBook: (id, changes) => {
      log("updateBook");
      return updateBook(id, changes, dao);
    },
    deleteBook: (id) => {
      log("deleteBook");
      return deleteBook(id, dao);
    },
  };
}

export default makeBookUseCases;
