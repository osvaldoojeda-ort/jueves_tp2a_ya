// usecases/getBookById.js
// Devuelve el libro o null. No lanza error: decidir que null = 404 es una decisión HTTP (controller).
async function getBookById(id, dao) {
  return dao.getById(id);
}

export default getBookById;
