// usecases/deleteBook.js
async function deleteBook(id, dao) {
  return dao.delete(id); // true si lo borró, false si no existía
}

export default deleteBook;
