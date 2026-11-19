import { describe, it, expect } from "vitest";
import { buildLoanScenario, ANA } from "../../helpers/loanScenario.js";
import deleteBook from "../../../useCases/books/deleteBook.js";

/**
 * Clase 14 - Ejercicio 10.1: deleteBook tenía 0% de cobertura.
 * Reusamos el helper de préstamos porque necesitamos un DAO de libros Y uno de préstamos conectados.
 */
describe("deleteBook", () => {
  it("borra un libro sin préstamos y devuelve true", async () => {
    const { booksDao, loansDao } = buildLoanScenario();

    expect(await deleteBook(1, booksDao, loansDao)).toBe(true);
    expect(await booksDao.getById(1)).toBeNull();
  });

  it("un libro inexistente devuelve false", async () => {
    const { booksDao, loansDao } = buildLoanScenario();

    expect(await deleteBook(999, booksDao, loansDao)).toBe(false);
  });

  it.each([
    ["activo", undefined],
    ["ya devuelto (histórico)", "2026-10-10"],
  ])("con un préstamo %s → 409 BOOK_HAS_LOANS y el libro sigue existiendo", async (_, devueltoEl) => {
    const { booksDao, loansDao, givenLoan } = buildLoanScenario();
    await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-15", devueltoEl });

    await expect(deleteBook(1, booksDao, loansDao)).rejects.toMatchObject({ code: "BOOK_HAS_LOANS", statusCode: 409 });
    expect(await booksDao.getById(1)).not.toBeNull();
  });

  it("acepta el id como string (llega así desde req.params)", async () => {
    const { booksDao, loansDao, givenLoan } = buildLoanScenario();
    await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-15" });

    await expect(deleteBook("1", booksDao, loansDao)).rejects.toMatchObject({ code: "BOOK_HAS_LOANS" });
  });
});