import booksMemoryDao from "../books/BooksMemoryDao.js";
import usersMemoryDao from "../users/UsersMemoryDao.js";

/**
 * Adaptador DAO en memoria para Préstamos (tabla intermedia usuario <-> libro).
 * Respeta la misma interfaz pública que LoansSequelizeDao.
 * Colabora con los DAOs en memoria de libros (stock) y usuarios (para resolver `usuario` y `libro`).
 */
class LoansMemoryDao {
  #loans = [];
  #nextId = 1;
  #booksDao;
  #usersDao;

  constructor(booksDao = booksMemoryDao, usersDao = usersMemoryDao) {
    this.#booksDao = booksDao;
    this.#usersDao = usersDao;
  }

  // Adjunta usuario y libro con las mismas columnas que el include de Sequelize
  async #withRelations(loan) {
    const user = await this.#usersDao.getById(loan.userId);
    const book = await this.#booksDao.getById(loan.bookId);
    return {
      ...loan,
      usuario: user ? { id: user.id, nombre: user.nombre } : null,
      libro: book ? { id: book.id, titulo: book.titulo } : null,
    };
  }

  // filters: { userId, bookId, activos } (activos: true = sin devolver, false = ya devueltos)
  // userId y bookId aceptan un número o un arreglo de números (equivale a IN).
  async getAll({ userId, bookId, activos } = {}) {
    const matches = (filter, value) => filter === undefined || [filter].flat().includes(value);
    const result = this.#loans.filter(
      (l) =>
        matches(userId, l.userId) &&
        matches(bookId, l.bookId) &&
        (activos === undefined || (l.fechaDevolucion === null) === activos)
    );
    return Promise.all(result.map((l) => this.#withRelations(l)));
  }

  async getById(id) {
    const loan = this.#loans.find((l) => l.id === Number(id));
    return loan ? this.#withRelations(loan) : null;
  }

  // Préstamo sin devolver de ese usuario para ese libro (o null)
  async getActive(userId, bookId) {
    const loan = this.#loans.find(
      (l) => l.userId === userId && l.bookId === bookId && l.fechaDevolucion === null
    );
    return loan ? this.#withRelations(loan) : null;
  }

  // Descuenta 1 de stock y registra el préstamo. Devuelve null si no hay stock.
  async lend({ userId, bookId }) {
    const book = await this.#booksDao.adjustStock(bookId, -1);
    if (!book) return null;

    const loan = { id: this.#nextId++, userId, bookId, fechaPrestamo: new Date(), fechaDevolucion: null };
    this.#loans.push(loan);
    return this.#withRelations(loan);
  }

  // Marca la devolución y repone 1 de stock. Devuelve null si ya estaba devuelto o no existe.
  async giveBack(id) {
    const loan = this.#loans.find((l) => l.id === Number(id));
    if (!loan || loan.fechaDevolucion !== null) return null;

    loan.fechaDevolucion = new Date();
    await this.#booksDao.adjustStock(loan.bookId, 1);
    return this.#withRelations(loan);
  }
}

export { LoansMemoryDao };
export default new LoansMemoryDao();
