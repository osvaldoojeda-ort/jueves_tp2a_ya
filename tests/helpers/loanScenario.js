import { BooksMemoryDao } from "../../dao/books/BooksMemoryDao.js";
import { UsersMemoryDao } from "../../dao/users/UsersMemoryDao.js";
import { LoansMemoryDao } from "../../dao/loans/LoansMemoryDao.js";
import createEventBus from "../../events/eventBus.js";
import createClock from "../../utils/clock.js";
import createFakeHolidays from "../../gateways/fakeHolidays.js";
import makeLoanUseCases from "../../usecases/loans/makeLoanUseCases.js";

/**
 * Helper de escenarios para los tests de préstamos (Clase 14).
 *
 * Cada test llama a buildLoanScenario() y recibe un "mundo" NUEVO: DAOs en memoria recién creados,
 * un bus de eventos propio, un reloj FIJO y feriados falsos. Nada se comparte entre tests.
 *
 * ¿Por qué no usamos los DAOs que exporta cada archivo (`export default new BooksMemoryDao()`)?
 * Porque son únicos para todo el proceso: si un test presta un libro, el siguiente lo encontraría prestado,
 * y el resultado dependería del ORDEN en que corren los tests. Instanciamos la clase en cada escenario.
 */

// Actores: lo que el middleware de auth deja en req.user (el caso de uso solo mira id y rol)
export const ANA = { id: 1, rol: "lector" };
export const BETO = { id: 2, rol: "lector" };
export const ADMIN = { id: 99, rol: "admin" };

const USERS = [
  { id: 1, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "x" },
  { id: 2, nombre: "Beto", email: "beto@test.com", rol: "lector", passwordHash: "x" },
  { id: 99, nombre: "Admin", email: "admin@test.com", rol: "admin", passwordHash: "x" },
];

const BOOKS = [
  { id: 1, titulo: "Libro 1", autor: "Autor", isbn: null, stock: 5 },
  { id: 2, titulo: "Libro 2", autor: "Autor", isbn: null, stock: 5 },
  { id: 3, titulo: "Libro 3", autor: "Autor", isbn: null, stock: 5 },
  { id: 4, titulo: "Libro 4", autor: "Autor", isbn: null, stock: 5 },
  { id: 5, titulo: "Libro 5", autor: "Autor", isbn: null, stock: 5 },
  { id: 6, titulo: "Agotado", autor: "Autor", isbn: null, stock: 0 },
];

// "Hoy" por defecto: miércoles 4 de noviembre de 2026, a media mañana en Buenos Aires
export const DEFAULT_NOW = "2026-11-04T12:00:00-03:00";

export function buildLoanScenario({
  now = DEFAULT_NOW,
  books = BOOKS,
  users = USERS,
  loanRules = {},
  holidays = createFakeHolidays(),
  lowStockThreshold = 0, // 0 = no molesta con eventos salvo en los tests que lo piden
} = {}) {
  // Copiamos cada objeto: el DAO en memoria MODIFICA los libros (stock) y no queremos tocar los datos de arriba
  const booksDao = new BooksMemoryDao(books.map((b) => ({ ...b })));
  const usersDao = new UsersMemoryDao(users.map((u) => ({ ...u })));
  const loansDao = new LoansMemoryDao(booksDao, usersDao);
  const events = createEventBus();
  const clock = createClock({ fixedNow: now });
  const rules = { maxActive: 3, businessDays: 10, maxRenewals: 1, ...loanRules };

  const useCases = makeLoanUseCases({
    loansDao,
    booksDao,
    usersDao,
    events,
    clock,
    holidays,
    loanRules: rules,
    lowStockThreshold,
  });

  /**
   * Arma el PASADO directamente en el DAO, sin pasar por las reglas.
   * Sirve para preparar situaciones que con la API llevarían días: un préstamo vencido, uno ya renovado, uno devuelto.
   * Las fechas son AAAA-MM-DD.
   */
  async function givenLoan({ userId, bookId, fechaPrestamo = "2026-10-01", fechaVencimiento, renovaciones = 0, devueltoEl }) {
    let loan = await loansDao.lend({
      userId,
      bookId,
      fechaPrestamo: new Date(`${fechaPrestamo}T12:00:00-03:00`),
      fechaVencimiento,
    });
    for (let i = 0; i < renovaciones; i++) {
      loan = await loansDao.renew(loan.id, { fechaVencimiento, renovacionesPrevias: i });
    }
    if (devueltoEl) {
      loan = await loansDao.giveBack(loan.id, new Date(`${devueltoEl}T12:00:00-03:00`));
    }
    return loan;
  }

  // Atajo para leer el stock actual de un libro
  const stockOf = async (bookId) => (await booksDao.getById(bookId)).stock;

  return { useCases, loansDao, booksDao, usersDao, events, clock, holidays, givenLoan, stockOf };
}
