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

/*
 * ===================== RESPUESTAS DE LA CLASE 14 =====================
 *
 * 4.6 ¿Por qué hay que COPIAR cada libro antes de pasárselo al DAO?
 *   Porque BooksMemoryDao.adjustStock modifica el objeto que guarda (book.stock += delta). Si le pasáramos el
 *   mismo objeto de BOOKS, el primer test que presta el libro 1 le bajaría el stock "para siempre", y el
 *   siguiente test arrancaría con 4 en vez de 5. Copiando, cada escenario tiene sus propios libros.
 *
 * 1.6 ¿Por qué Vitest va en devDependencies? Porque solo se usa para desarrollar y testear: el servidor nunca lo
 *   importa. En producción se instala con `npm ci --omit=dev`; si estuviera en dependencies, se instalaría igual:
 *   más megas, más tiempo de deploy y más paquetes con posibles vulnerabilidades, sin ningún beneficio.
 *
 * 2.1 Borde del ISBN 9780000000040 (dígito de control 0): falla la implementación que olvida el último % 10.
 *   Con suma 100, 10 - (100 % 10) da 10, no 0. Todos los demás casos tienen dígito 1 a 9 y pasan igual.
 *
 * 3.1 ¿Por qué hace falta la función flecha en expect(() => createClock(...)).toThrow()? Porque el error tiene que
 *   ocurrir ADENTRO de expect. Sin la flecha, createClock(...) se ejecuta antes de llamar a expect, el error sale
 *   y corta el test antes de que expect pueda atraparlo y compararlo.
 *
 * 5.8 Sacarle el `await` a un `expect(...).rejects`: en Vitest 5 el test SÍ se pone en rojo, con el mensaje
 *   "Promise returned by `expect(actual).rejects...` was not awaited". En versiones viejas quedaba en VERDE: el
 *   test terminaba antes de que la promesa se resolviera, y la aserción fallida aparecía (si aparecía) como un
 *   "unhandled rejection" suelto. Era un falso positivo: por eso siempre `await expect(...).rejects`.
 *
 *  * 7.2 ¿Qué tiene que ver crear un libro con JWT_SECRET? Nada: createBook importaba LOW_STOCK_THRESHOLD de
 *   config.js, y config.js corta todo con required("JWT_SECRET") apenas se importa. El test mostró un ACOPLAMIENTO.
 * 7.6 Definir JWT_SECRET en Vitest o hacer vi.mock("config.js") es peor: tapa el síntoma y deja el acoplamiento.
 *   El caso de uso seguiría leyendo una variable global y el test dependería de la configuración del entorno.
 *   Inyectando el umbral, el test pasa el valor que quiere (2, 10...) y prueba bordes sin tocar nada global.
 *
 * 8.3 ¿Cuánto tardaría la suite con bcrypt real (10 rondas) en loginUser? Cada hash/compare tarda ~50-100 ms:
 *   unos pocos segundos solo para ese archivo, en vez de milisegundos. Con Open Library real en importBooks:
 *   cientos de ms por pedido, dependería de internet, y si la API está caída los tests fallarían sin que nuestro
 *   código tenga un bug. Los stubs hacen la suite rápida y determinista.
 * =====================================================================
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