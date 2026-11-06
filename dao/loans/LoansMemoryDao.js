import AppError from "../../errors/AppError.js";
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

  // filters: { userId, bookId, activos, prestadoDesde, prestadoAntesDe }
  //  - activos: true = sin devolver, false = ya devueltos
  //  - userId y bookId aceptan un número o un arreglo de números (equivale a IN).
  //  - prestadoDesde (inclusive) y prestadoAntesDe (exclusive) son instantes (Date) sobre fechaPrestamo.
  async getAll({ userId, bookId, activos, prestadoDesde, prestadoAntesDe } = {}) {
    const matches = (filter, value) => filter === undefined || [filter].flat().includes(value);
    const result = this.#loans.filter(
      (l) =>
        matches(userId, l.userId) &&
        matches(bookId, l.bookId) &&
        (activos === undefined || (l.fechaDevolucion === null) === activos) &&
        (prestadoDesde === undefined || l.fechaPrestamo >= prestadoDesde) &&
        (prestadoAntesDe === undefined || l.fechaPrestamo < prestadoAntesDe)
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
  // Las fechas las decide el caso de uso (que tiene el reloj inyectado); el DAO solo las guarda.
  async lend({ userId, bookId, fechaPrestamo, fechaVencimiento }) {
    // Equivalente al índice único parcial de Sequelize: chequeo y alta en el MISMO paso síncrono
    // (sin un await en el medio), así dos pedidos simultáneos no pueden pasar los dos.
    if (this.#loans.some((l) => l.userId === userId && l.bookId === bookId && l.fechaDevolucion === null)) {
      throw new AppError("ALREADY_LOANED", "El usuario ya tiene ese libro sin devolver", 409);
    }
    const loan = { id: this.#nextId++, userId, bookId, fechaPrestamo, fechaVencimiento, fechaDevolucion: null, renovaciones: 0 };
    this.#loans.push(loan);

    const book = await this.#booksDao.adjustStock(bookId, -1);
    if (!book) {
      this.#loans.splice(this.#loans.indexOf(loan), 1); // sin stock: se deshace el alta
      return null;
    }
    return this.#withRelations(loan);
  }

  // Marca la devolución y repone 1 de stock. Devuelve null si ya estaba devuelto o no existe.
  async giveBack(id, fechaDevolucion) {
    const loan = this.#loans.find((l) => l.id === Number(id));
    if (!loan || loan.fechaDevolucion !== null) return null;

    loan.fechaDevolucion = fechaDevolucion;
    await this.#booksDao.adjustStock(loan.bookId, 1);
    return this.#withRelations(loan);
  }

  // Renueva: nuevo vencimiento y renovaciones + 1. Solo si sigue activo y nadie lo renovó en el medio
  // (renovacionesPrevias = lo que leyó el caso de uso). Devuelve null si el préstamo cambió.
  async renew(id, { fechaVencimiento, renovacionesPrevias }) {
    const loan = this.#loans.find((l) => l.id === Number(id));
    if (!loan || loan.fechaDevolucion !== null || loan.renovaciones !== renovacionesPrevias) return null;

    loan.fechaVencimiento = fechaVencimiento;
    loan.renovaciones += 1;
    return this.#withRelations(loan);
  }
}

export { LoansMemoryDao };
export default new LoansMemoryDao();
