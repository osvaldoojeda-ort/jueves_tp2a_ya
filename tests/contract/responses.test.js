import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildLoanScenario, ANA, ADMIN } from "../helpers/loanScenario.js";
import { BooksMemoryDao } from "../../dao/books/BooksMemoryDao.js";
import { UsersMemoryDao } from "../../dao/users/UsersMemoryDao.js";
import { LoansMemoryDao } from "../../dao/loans/LoansMemoryDao.js";
import makeBookUseCases from "../../usecases/books/makeBookUseCases.js";
import makeAuthUseCases from "../../usecases/auth/makeAuthUseCases.js";
import makeCatalogUseCases from "../../usecases/catalog/makeCatalogUseCases.js";
import createFakeCatalog from "../../gateways/fakeCatalog.js";
import AppError from "../../errors/AppError.js";
import * as R from "../../docs/responseSchemas.js";

/**
 * Tests de CONTRATO de las respuestas (Clase 15).
 *
 * La documentación promete una forma para cada respuesta (docs/responseSchemas.js). Estos tests ejecutan los casos
 * de uso de verdad y verifican que lo que devuelven cumple esa promesa. Si mañana un caso de uso agrega, quita o
 * renombra un campo, el test falla y avisa: "la documentación quedó vieja" (o "rompiste a los clientes").
 *
 * Detalle importante: no se valida el objeto que devuelve el caso de uso, sino lo que viaja por la red.
 * `wire()` hace lo mismo que `res.json()`: JSON.stringify. Por ejemplo, un `Date` se convierte en texto ISO.
 *
 * Ejercicio 8.3 — Qué encontramos: el test de returnLoan falló con `Unrecognized key: "atrasoAlDevolver"`. El código
 * estaba bien (la Clase 13 agregó ese dato a propósito: al devolver, diasAtraso ya es 0); lo que estaba mal era la
 * DOCUMENTACIÓN. Decisión: agregar el campo al esquema Loan, con su descripción.
 *
 * Ejercicio 8.4 — Los tests de la Clase 14 verifican las REGLAS (prestar con 3 activos → 409). Un test de contrato
 * verifica la FORMA de lo que sale: que no aparezcan campos que la documentación no menciona (ni un passwordHash),
 * que no falten los que promete, y que los tipos sean los anunciados (fechas como texto ISO, no objetos).
 */
const wire = (value) => JSON.parse(JSON.stringify(value));

// Falla con un mensaje legible: qué campo no cumple y por qué
function expectToMatchContract(schema, value) {
  const result = schema.safeParse(wire(value));
  expect(result.success, result.error && JSON.stringify(result.error.issues, null, 2)).toBe(true);
}

describe("contrato: préstamos", () => {
  let scenario;

  beforeEach(() => {
    scenario = buildLoanScenario();
  });

  it("POST /loans devuelve un Loan (con holidaysAvailable)", async () => {
    const loan = await scenario.useCases.createLoan({ bookId: 1 }, ANA);
    expectToMatchContract(R.Loan, loan);
  });

  it("GET /loans devuelve Loan[], incluidos los vencidos y los devueltos", async () => {
    await scenario.givenLoan({ userId: 1, bookId: 2, fechaVencimiento: "2026-10-15" }); // vencido
    await scenario.givenLoan({ userId: 1, bookId: 3, fechaVencimiento: "2026-10-15", devueltoEl: "2026-10-10" });
    await scenario.useCases.createLoan({ bookId: 1 }, ADMIN).catch(() => {}); // el admin no tiene préstamos vencidos

    const loans = await scenario.useCases.getLoans({}, ADMIN);

    expect(loans.length).toBeGreaterThan(0);
    expectToMatchContract(R.Loan.array(), loans);
  });

  it("PUT /loans/:id/renew y /return devuelven un Loan", async () => {
    const loan = await scenario.useCases.createLoan({ bookId: 1 }, ANA);
    expectToMatchContract(R.Loan, await scenario.useCases.renewLoan(loan.id, ANA));
    expectToMatchContract(R.Loan, await scenario.useCases.returnLoan(loan.id, ANA));
  });
});

describe("contrato: libros", () => {
  let books;

  beforeEach(() => {
    const booksDao = new BooksMemoryDao([
      { id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: "9780156012195", stock: 3 },
      { id: 2, titulo: "Sin ISBN", autor: "Anónimo", isbn: null, stock: 1 },
    ]);
    const usersDao = new UsersMemoryDao([{ id: 1, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "x" }]);
    const loansDao = new LoansMemoryDao(booksDao, usersDao);
    const catalog = createFakeCatalog({ latencyMs: 0 });
    books = makeBookUseCases(booksDao, loansDao, { emit: vi.fn() }, catalog, { importConcurrency: 2, lowStockThreshold: 0 });
  });

  it("GET /books devuelve Book[] (también con incluir=usuarios)", async () => {
    expectToMatchContract(R.BookWithUsers.array(), await books.getBooks({}));
    expectToMatchContract(R.BookWithUsers.array(), await books.getBooks({ incluir: "usuarios" }));
  });

  it("POST /books devuelve un Book", async () => {
    expectToMatchContract(R.Book, await books.createBook({ titulo: "Ficciones", autor: "Borges", stock: 2 }));
  });

  it.each([
    [1, "ok"],
    [2, "no_isbn"],
  ])("GET /books/%i/details devuelve un BookDetails (%s)", async (id, status) => {
    const details = await books.getBookDetails(id);
    expect(details.externalStatus).toBe(status);
    expectToMatchContract(R.BookDetails, details);
  });

  it("POST /books/import devuelve un ImportReport con las cuatro listas", async () => {
    const report = await books.importBooks({
      isbns: ["9780140328721", "9780156012195", "9789999999999", "0001234567890"],
      stock: 3,
    });

    expect(report.imported).toHaveLength(1);
    expect(report.skipped).toHaveLength(1);
    expect(report.notFound).toHaveLength(1);
    expect(report.failed).toHaveLength(1);
    expectToMatchContract(R.ImportReport, report);
  });
});

describe("contrato: catálogo", () => {
  it.each(["sequential", "parallel", "batch"])("GET /catalog/lookup?mode=%s devuelve un LookupResult", async (mode) => {
    const { lookupIsbns } = makeCatalogUseCases(createFakeCatalog({ latencyMs: 0 }));
    const isbns = mode === "batch" ? ["9780156012195", "9789999999999"] : ["9780156012195", "9789999999999", "0001234567890"];

    expectToMatchContract(R.LookupResult, await lookupIsbns({ isbns, mode }));
  });
});

describe("contrato: autenticación", () => {
  let auth;

  beforeEach(() => {
    const usersDao = new UsersMemoryDao([
      { id: 1, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "hash:Secreta123" },
    ]);
    const booksDao = new BooksMemoryDao([]);
    auth = makeAuthUseCases({
      usersDao,
      loansDao: new LoansMemoryDao(booksDao, usersDao),
      events: { emit: vi.fn() },
      hasher: { hash: async (plain) => `hash:${plain}`, compare: async (plain, hash) => hash === `hash:${plain}` },
      tokens: { sign: () => "token-de-prueba" },
    });
  });

  it("POST /auth/login devuelve un LoginResponse (y el usuario sin passwordHash)", async () => {
    expectToMatchContract(R.LoginResponse, await auth.login({ email: "ana@test.com", password: "Secreta123" }));
  });

  it("POST /auth/register devuelve un User", async () => {
    expectToMatchContract(R.User, await auth.register({ nombre: "Beto", email: "beto@test.com", password: "Secreta123" }));
  });

  it("GET /auth/me?incluir=libros devuelve un UserWithBooks", async () => {
    expectToMatchContract(R.UserWithBooks, await auth.getProfile(1, { incluir: "libros" }));
  });
});

describe("contrato: errores", () => {
  it("el formato de error documentado es el que arma el errorHandler", () => {
    // Lo mismo que escribe middlewares/errorHandler.js para un AppError con details
    const err = new AppError("VALIDATION_ERROR", "Datos de body inválidos", 400, [{ field: "titulo", message: "Requerido" }]);
    const body = { error: { code: err.code, message: err.message, details: err.details } };

    expectToMatchContract(R.ErrorResponse, body);
  });

  it("el esquema estricto detecta un campo de más (por ejemplo, un passwordHash que se filtra)", () => {
    const leaked = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "$2b$10$..." };

    expect(R.User.safeParse(leaked).success).toBe(false);
  });
});
