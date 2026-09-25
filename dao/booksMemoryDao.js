// dao/booksMemoryDao.js
// Adaptador de persistencia en memoria. Implementa el contrato (puerto) del DAO.
// Todos los métodos son async para que el contrato no cambie cuando pasemos a Sequelize (clase 9).

let books = [
  { id: 1, titulo: "El principito",        autor: "Saint-Exupéry",  isbn: null, stock: 3 },
  { id: 2, titulo: "Cien años de soledad", autor: "García Márquez", isbn: null, stock: 1 },
];
let nextId = 3;

const booksMemoryDao = {
  async getAll() {
    return [...books]; // copia defensiva: el que llama no puede modificar el array interno
  },

  async getById(id) {
    return books.find((b) => b.id === id) ?? null;
  },

  async getByIsbn(isbn) {
    return books.find((b) => b.isbn === isbn) ?? null;
  },

  async save(book) {
    // Ignoramos un posible id entrante: el id lo asigna SIEMPRE la persistencia.
    // Si no lo hiciéramos, un cliente podría mandar { id: 1, ... } y duplicar ids.
    const { id: _ignored, ...data } = book;
    const newBook = { id: nextId++, ...data };
    books.push(newBook);
    return newBook;
  },

  async update(id, changes) {
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const { id: _ignored, ...safeChanges } = changes; // tampoco dejamos pisar el id
    books[idx] = { ...books[idx], ...safeChanges };
    return books[idx];
  },

  async delete(id) {
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    books.splice(idx, 1);
    return true;
  },
};

export default booksMemoryDao;
