// usecases/getBooks.js
async function getBooks(dao) {
  return dao.getAll();
}

export default getBooks;
