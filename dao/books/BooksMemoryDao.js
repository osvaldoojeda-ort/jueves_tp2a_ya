import usersMemoryDao from "../users/UsersMemoryDao.js";

/**
 * Adaptador DAO en memoria para Libros utilizando Clases de ES6.
 * Todos los métodos son `async` para mantener la firma ante futuros adaptadores (ej: Sequelize).
 */
class BooksMemoryDao {
  // Campos privados (ES2020): protegidos de acceso o modificación directa desde fuera
  #books;
  #nextId;
  #usersDao;

  // usersDao se usa para resolver `usuario`, igual que el include de Sequelize
  constructor(initialBooks = [
    { id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: null, stock: 3, userId: null },
    { id: 2, titulo: "Cien años de soledad", autor: "García Márquez", isbn: null, stock: 1, userId: null },
  ], usersDao = usersMemoryDao) {
    this.#books = [...initialBooks];
    this.#usersDao = usersDao;
    this.#updateNextId();
  }

  // Recalcula el próximo ID basándose en el ID máximo actual en el arreglo
  #updateNextId() {
    const maxId = this.#books.reduce((max, book) => (book.id > max ? book.id : max), 0);
    this.#nextId = maxId + 1;
  }

  // Adjunta el usuario propietario (o null) con la misma forma que devuelve Sequelize
  async #withUser(book) {
    const owner = book.userId == null ? null : await this.#usersDao.getById(book.userId);
    // Mismas columnas que el include de Sequelize: solo id y nombre
    const usuario = owner ? { id: owner.id, nombre: owner.nombre } : null;
    // Si el usuario fue borrado, userId queda en null (como el ON DELETE SET NULL de la BD)
    return { ...book, userId: usuario ? book.userId : null, usuario };
  }

  // Devuelve todos los libros (con su usuario) utilizando copias defensivas
  async getAll() {
    return Promise.all(this.#books.map((book) => this.#withUser(book)));
  }

  // Busca un libro por su ID numérico
  async getById(id) {
    const book = this.#books.find((b) => b.id === Number(id));
    return book ? this.#withUser(book) : null;
  }

  // Busca un libro por su código ISBN
  async getByIsbn(isbn) {
    return this.#books.find((book) => book.isbn === isbn) ?? null;
  }

  // Guarda un nuevo libro asegurando que el ID sea autoincremental e ignorando IDs externos
  async save(data) {
    const { id: _ignored, ...bookData } = data;
    const maxId = this.#books.reduce((max, book) => (book.id > max ? book.id : max), 0);
    const assignedId = Math.max(this.#nextId, maxId + 1);

    const newBook = { id: assignedId, ...bookData, isbn: bookData.isbn ?? null, userId: bookData.userId ?? null };
    this.#books.push(newBook);
    this.#nextId = assignedId + 1;
    return { ...newBook };
  }

  // Actualiza los campos especificados de un libro ignorando modificaciones al ID
  async update(id, changes) {
    const index = this.#books.findIndex((book) => book.id === Number(id));
    if (index === -1) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    this.#books[index] = { ...this.#books[index], ...allowedChanges };
    return { ...this.#books[index] };
  }

  // Elimina un libro por ID
  async delete(id) {
    const index = this.#books.findIndex((book) => book.id === Number(id));
    if (index === -1) return false;

    this.#books.splice(index, 1);
    return true;
  }
}

// Exportamos la instancia por defecto y la clase por si se requiere instanciar nuevamente (ej: en tests)
export { BooksMemoryDao };
export default new BooksMemoryDao();
