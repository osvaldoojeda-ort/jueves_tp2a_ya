import { describe, it, expect } from "vitest";
import { buildLoanScenario, ANA, BETO } from "../../helpers/loanScenario.js";
import deleteUser from "../../../useCases/users/deleteUser.js";

/**
 * Clase 14 - Ejercicio 10.1: deleteUser, misma regla que deleteBook (409 si tiene préstamos).
 */
describe("deleteUser", () => {
  it("borra un usuario sin préstamos y devuelve true", async () => {
    const { usersDao, loansDao } = buildLoanScenario();

    expect(await deleteUser(BETO.id, usersDao, loansDao)).toBe(true);
    expect(await usersDao.getById(BETO.id)).toBeNull();
  });

  it("un usuario inexistente devuelve false", async () => {
    const { usersDao, loansDao } = buildLoanScenario();

    expect(await deleteUser(999, usersDao, loansDao)).toBe(false);
  });

  it.each([
    ["activo", undefined],
    ["ya devuelto (histórico)", "2026-10-10"],
  ])("con un préstamo %s → 409 USER_HAS_LOANS y el usuario sigue existiendo", async (_, devueltoEl) => {
    const { usersDao, loansDao, givenLoan } = buildLoanScenario();
    await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-15", devueltoEl });

    await expect(deleteUser(String(ANA.id), usersDao, loansDao)).rejects.toMatchObject({
      code: "USER_HAS_LOANS",
      statusCode: 409,
    });
    expect(await usersDao.getById(ANA.id)).not.toBeNull();
  });
});