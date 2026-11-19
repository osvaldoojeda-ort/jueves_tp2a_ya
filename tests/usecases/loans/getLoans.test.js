import { describe, it, expect, vi } from "vitest";
import { buildLoanScenario, ANA, BETO, ADMIN } from "../../helpers/loanScenario.js";

/**
 * Clase 14 - Ejercicio 10.1: getLoans era el archivo con 0% de cobertura en useCases/loans.
 * Reglas que cuida: el lector solo ve lo suyo (403 si pide lo de otro), el admin ve todo,
 * y `desde`/`hasta` (días) se traducen a instantes con clock.startOfDay.
 */
describe("getLoans", () => {
  // Un mundo con préstamos de Ana y de Beto, en distintas fechas
  async function scenarioWithLoans() {
    const scenario = buildLoanScenario(); // hoy: 2026-11-04
    const { givenLoan } = scenario;
    await givenLoan({ userId: ANA.id, bookId: 1, fechaPrestamo: "2026-10-01", fechaVencimiento: "2026-10-15" }); // vencido
    await givenLoan({ userId: ANA.id, bookId: 2, fechaPrestamo: "2026-11-02", fechaVencimiento: "2026-11-16" });
    await givenLoan({ userId: BETO.id, bookId: 3, fechaPrestamo: "2026-11-03", fechaVencimiento: "2026-11-17" });
    return scenario;
  }

  it("un lector sin filtros ve SOLO sus préstamos", async () => {
    const { useCases } = await scenarioWithLoans();

    const loans = await useCases.getLoans({}, ANA);

    expect(loans).toHaveLength(2);
    expect(loans.every((l) => l.userId === ANA.id)).toBe(true);
  });

  it("un lector que pide los préstamos de otro → 403 FORBIDDEN", async () => {
    const { useCases } = await scenarioWithLoans();

    await expect(useCases.getLoans({ userId: BETO.id }, ANA)).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("un lector puede pedir explícitamente los suyos (userId = su id)", async () => {
    const { useCases } = await scenarioWithLoans();

    const loans = await useCases.getLoans({ userId: ANA.id }, ANA);

    expect(loans).toHaveLength(2);
  });

  it("el admin ve todos, y puede filtrar por cualquier usuario", async () => {
    const { useCases } = await scenarioWithLoans();

    expect(await useCases.getLoans({}, ADMIN)).toHaveLength(3);
    expect(await useCases.getLoans({ userId: BETO.id }, ADMIN)).toHaveLength(1);
  });

  it("cada préstamo vuelve con su estado calculado", async () => {
    const { useCases } = await scenarioWithLoans();

    const loans = await useCases.getLoans({}, ANA);

    expect(loans.map((l) => l.estado).sort()).toEqual(["activo", "vencido"]);
  });

    it("filtra por libro: los filtros que no son de acceso pasan tal cual al DAO", async () => {
    const { useCases } = await scenarioWithLoans();

    const loans = await useCases.getLoans({ bookId: 3 }, ADMIN);

    expect(loans).toHaveLength(1);
    expect(loans[0]).toMatchObject({ userId: BETO.id, bookId: 3, estado: "activo" });
  });

  it("desde/hasta son días INCLUSIVOS: se traducen con clock.startOfDay (hasta → inicio del día siguiente)", async () => {
    const { useCases, loansDao, clock } = await scenarioWithLoans();
    const spy = vi.spyOn(loansDao, "getAll");

    const loans = await useCases.getLoans({ desde: "2026-11-02", hasta: "2026-11-03" }, ADMIN);

    expect(loans.map((l) => l.bookId).sort()).toEqual([2, 3]); // el del 01/10 queda afuera
    expect(spy).toHaveBeenCalledWith({
      prestadoDesde: clock.startOfDay("2026-11-02"),
      prestadoAntesDe: clock.startOfDay("2026-11-04"),
    });
  });
});