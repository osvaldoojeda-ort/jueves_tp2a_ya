import { describe, it, expect } from "vitest";
import { buildLoanScenario, ANA, BETO, ADMIN } from "../../helpers/loanScenario.js";

/**
 * renewLoan (R4): una regla de negocio como CADENA de condiciones, cada una con su `code`.
 * Orden: existencia → permiso → estado → regla. Hoy (reloj fijo) es el miércoles 2026-11-04.
 */

describe("renewLoan", () => {
  it("renueva: el nuevo vencimiento se cuenta desde el vencimiento ACTUAL, no desde hoy", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });

    const renewed = await useCases.renewLoan(loan.id, ANA);

    // 10 hábiles desde el jueves 19, salteando el feriado del lunes 23 (datos falsos)
    expect(renewed).toMatchObject({
      fechaVencimiento: "2026-12-04",
      renovaciones: 1,
      estado: "activo",
      holidaysAvailable: true,
    });
  });

  it("préstamo inexistente → 404 LOAN_NOT_FOUND", async () => {
    const { useCases } = buildLoanScenario();

    await expect(useCases.renewLoan(123, ANA)).rejects.toMatchObject({ code: "LOAN_NOT_FOUND", statusCode: 404 });
  });

  it("un lector no puede renovar un préstamo ajeno → 403 FORBIDDEN", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const deBeto = await givenLoan({ userId: BETO.id, bookId: 1, fechaVencimiento: "2026-11-19" });

    await expect(useCases.renewLoan(deBeto.id, ANA)).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("el admin puede renovar el préstamo de cualquiera", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const deBeto = await givenLoan({ userId: BETO.id, bookId: 1, fechaVencimiento: "2026-11-19" });

    await expect(useCases.renewLoan(deBeto.id, ADMIN)).resolves.toMatchObject({ renovaciones: 1 });
  });

  it("un préstamo devuelto no se renueva → 409 ALREADY_RETURNED", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19", devueltoEl: "2026-11-02" });

    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({ code: "ALREADY_RETURNED", statusCode: 409 });
  });

  it("orden: si es ajeno Y está devuelto, primero responde el permiso (403), no el estado", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: BETO.id, bookId: 1, fechaVencimiento: "2026-11-19", devueltoEl: "2026-11-02" });

    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("un préstamo vencido no se renueva → 409 LOAN_OVERDUE", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-03" });

    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({ code: "LOAN_OVERDUE", statusCode: 409 });
  });

  it("borde: el mismo día del vencimiento todavía se puede renovar", async () => {
    const { useCases, givenLoan } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-04" });

    await expect(useCases.renewLoan(loan.id, ANA)).resolves.toMatchObject({ renovaciones: 1 });
  });

  it("solo se renueva una vez → 409 RENEWAL_LIMIT_REACHED, y el vencimiento no cambia", async () => {
    const { useCases, givenLoan, loansDao } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });
    const primera = await useCases.renewLoan(loan.id, ANA);

    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({
      code: "RENEWAL_LIMIT_REACHED",
      statusCode: 409,
      message: expect.stringContaining("1 vez"),
    });

    // Estado sin cambios tras el rechazo
    const despues = await loansDao.getById(loan.id);
    expect(despues.fechaVencimiento).toBe(primera.fechaVencimiento);
    expect(despues.renovaciones).toBe(1);
  });

  it("el límite de renovaciones es configuración: con maxRenewals = 2 se renueva dos veces", async () => {
    const { useCases, givenLoan } = buildLoanScenario({ loanRules: { maxRenewals: 2 } });
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });

    await useCases.renewLoan(loan.id, ANA);
    await expect(useCases.renewLoan(loan.id, ANA)).resolves.toMatchObject({ renovaciones: 2 });
    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({
      code: "RENEWAL_LIMIT_REACHED",
      message: expect.stringContaining("2 veces"),
    });
  });

  it("si el préstamo cambió entre la lectura y la escritura → 409 LOAN_CHANGED", async () => {
    const { useCases, givenLoan, loansDao } = buildLoanScenario();
    const loan = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-19" });
    // Simulamos la carrera: el DAO devuelve null, como si otro pedido lo hubiera renovado justo antes
    loansDao.renew = async () => null;

    await expect(useCases.renewLoan(loan.id, ANA)).rejects.toMatchObject({ code: "LOAN_CHANGED", statusCode: 409 });
  });
});
