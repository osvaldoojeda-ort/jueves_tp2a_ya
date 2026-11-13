import { describe, it, expect } from "vitest";
import { buildLoanScenario, ANA, BETO, ADMIN } from "../../helpers/loanScenario.js";

describe("returnLoan", () => {
  it("devuelve a tiempo: repone el stock, queda 'devuelto' y sin atraso", async () => {
    const { useCases, givenLoan, stockOf } = buildLoanScenario(); // hoy: 2026-11-04
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });
    expect(await stockOf(1)).toBe(4); // precondición: verificamos que el escenario es el que creemos

    const returned = await useCases.returnLoan(loan.id, ANA);

    expect(returned).toMatchObject({ estado: "devuelto", diasAtraso: 0, atrasoAlDevolver: 0 });
    expect(returned.fechaDevolucion).toEqual(new Date("2026-11-04T12:00:00-03:00")); // la puso el reloj
    expect(await stockOf(1)).toBe(5);
  });

  it("un préstamo vencido SÍ se puede devolver, e informa los días de atraso", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-28" });

    const returned = await useCases.returnLoan(loan.id, ANA);

    expect(returned.atrasoAlDevolver).toBe(7);
    expect(returned.estado).toBe("devuelto");
  });

  it("no se puede devolver dos veces → 409 ALREADY_RETURNED, y el stock se repone una sola vez", async () => {
    const { useCases, givenLoan, stockOf } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });
    await useCases.returnLoan(loan.id, ANA);

    await expect(useCases.returnLoan(loan.id, ANA)).rejects.toMatchObject({ code: "ALREADY_RETURNED", statusCode: 409 });
    expect(await stockOf(1)).toBe(5);
  });

  it("un lector no puede devolver un préstamo ajeno → 403, pero el admin sí", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const deBeto = await givenLoan({ userId: BETO.id, bookId: 1, fechaVencimiento: "2026-11-19" });

    await expect(useCases.returnLoan(deBeto.id, ANA)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(useCases.returnLoan(deBeto.id, ADMIN)).resolves.toMatchObject({ estado: "devuelto" });
  });

  it("préstamo inexistente → 404 LOAN_NOT_FOUND", async () => {
    const { useCases } = buildLoanScenario();

    await expect(useCases.returnLoan(42, ANA)).rejects.toMatchObject({ code: "LOAN_NOT_FOUND", statusCode: 404 });
  });
});
