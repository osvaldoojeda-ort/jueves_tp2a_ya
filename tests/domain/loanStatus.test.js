import { describe, it, expect } from "vitest";
import { isOverdue, loanStatus, withStatus } from "../../domain/loanStatus.js";

// Un "préstamo" para estos tests es solo un objeto: no hace falta ningún DAO
const activo = { id: 1, fechaVencimiento: "2026-11-18", fechaDevolucion: null };
const devuelto = { id: 2, fechaVencimiento: "2026-11-18", fechaDevolucion: new Date("2026-11-30T12:00:00Z") };

describe("isOverdue", () => {
  it("no está vencido antes de la fecha de vencimiento", () => {
    expect(isOverdue(activo, "2026-11-17")).toBe(false);
  });

  // EL BORDE: los bugs viven acá. ¿El día del vencimiento ya está vencido? Para nosotros, no.
  it("el MISMO día del vencimiento todavía no está vencido", () => {
    expect(isOverdue(activo, "2026-11-18")).toBe(false);
  });

  it("al día siguiente del vencimiento está vencido", () => {
    expect(isOverdue(activo, "2026-11-19")).toBe(true);
  });

  it("un préstamo devuelto nunca está vencido, aunque se haya devuelto tarde", () => {
    expect(isOverdue(devuelto, "2027-01-01")).toBe(false);
  });
});

describe("loanStatus", () => {
  it.each([
    [activo, "2026-11-10", "activo"],
    [activo, "2026-11-25", "vencido"],
    [devuelto, "2026-11-25", "devuelto"],
  ])("préstamo %# el %s → %s", (loan, today, esperado) => {
    expect(loanStatus(loan, today)).toBe(esperado);
  });
});

describe("withStatus", () => {
  it("agrega estado y diasAtraso sin modificar el préstamo original", () => {
    const result = withStatus(activo, "2026-11-25");

    // toMatchObject: alcanza con que ESTOS campos coincidan (el resto del objeto no importa)
    expect(result).toMatchObject({ id: 1, estado: "vencido", diasAtraso: 7 });
    // El original no se tocó: withStatus devuelve una copia
    expect(activo).not.toHaveProperty("estado");
  });

  it("un préstamo al día tiene 0 días de atraso", () => {
    expect(withStatus(activo, "2026-11-18").diasAtraso).toBe(0);
  });

  it("si recibe null devuelve null (getLoanById de un id que no existe)", () => {
    expect(withStatus(null, "2026-11-18")).toBeNull();
  });
});
