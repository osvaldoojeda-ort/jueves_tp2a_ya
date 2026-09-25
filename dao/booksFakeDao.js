// dao/booksFakeDao.js
// DESAFÍO OPCIONAL: DAO "falso" que cumple el contrato pero no persiste nada.
// Sirve para comprobar que los casos de uso funcionan con CUALQUIER objeto que respete el contrato.
// Para probarlo: en booksController.js cambiá el import del dao por este archivo. Después revertí.

const booksFakeDao = {
  async getAll() {
    console.log("[fakeDao] getAll()");
    return [{ id: 99, titulo: "Libro falso", autor: "Nadie", isbn: null, stock: 0 }];
  },
  async getById(id) {
    console.log(`[fakeDao] getById(${id})`);
    return { id, titulo: "Libro falso", autor: "Nadie", isbn: null, stock: 0 };
  },
  async getByIsbn(isbn) {
    console.log(`[fakeDao] getByIsbn(${isbn})`);
    return null;
  },
  async save(data) {
    console.log("[fakeDao] save()", data);
    return { id: 999, ...data };
  },
  async update(id, changes) {
    console.log(`[fakeDao] update(${id})`, changes);
    return { id, ...changes };
  },
  async delete(id) {
    console.log(`[fakeDao] delete(${id})`);
    return true;
  },
};

export default booksFakeDao;
