/**
 * Adaptador DAO en memoria para Libros utilizando Clases de ES6.
 * Todos los métodos son `async` para mantener la firma ante futuros adaptadores (ej: Sequelize).
 */
class BooksMemoryDao {
  // Campos privados (ES2020): protegidos de acceso o modificación directa desde fuera
  #books;
  #nextId;

  constructor(initialBooks = [
    { id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: null, stock: 3 },
    { id: 2, titulo: "Cien años de soledad", autor: "García Márquez", isbn: null, stock: 1 },
  ]) {
    this.#books = [...initialBooks];
    this.#updateNextId();
  }

  // Recalcula el próximo ID basándose en el ID máximo actual en el arreglo
  #updateNextId() {
    const maxId = this.#books.reduce((max, book) => (book.id > max ? book.id : max), 0);
    this.#nextId = maxId + 1;
  }

  // Lista libros aplicando filtros, orden y paginación (el equivalente en memoria del WHERE/ORDER BY/LIMIT de SQL).
  // filters: { autor, isbn, sort ("titulo" | "-titulo"), page, limit }
  async getAll({ autor, isbn, sort, page = 1, limit } = {}) {
    let books = this.#books.filter(
      (b) =>
        (autor === undefined || b.autor.toLowerCase().includes(autor.toLowerCase())) &&
        (isbn === undefined || b.isbn === isbn)
    );

    if (sort) {
      const desc = sort.startsWith("-");
      const field = desc ? sort.slice(1) : sort;
      books.sort((a, b) => {
        const valA = a[field] ?? "";
        const valB = b[field] ?? "";
        if (valA === valB) return a.id - b.id;
        return (valA < valB ? -1 : 1) * (desc ? -1 : 1);
      });
    }

    if (limit) books = books.slice((page - 1) * limit, page * limit);

    return books.map((book) => ({ ...book }));
  }

  // Busca un libro por su ID numérico
  async getById(id) {
    const book = this.#books.find((b) => b.id === Number(id));
    return book ? { ...book } : null;
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

    const newBook = { id: assignedId, ...bookData, isbn: bookData.isbn ?? null };
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

  // Suma `delta` al stock (puede ser negativo) solo si el resultado no queda por debajo de 0.
  // Es el equivalente en memoria del UPDATE condicional de Sequelize: sin `await` entre
  // la comprobación y la modificación, por lo que es atómico. Devuelve el libro o null.
  async adjustStock(id, delta) {
    const book = this.#books.find((b) => b.id === Number(id));
    if (!book || book.stock + delta < 0) return null;
    book.stock += delta;
    return { ...book };
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
