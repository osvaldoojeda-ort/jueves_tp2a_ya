import { describe, it, expect } from "vitest";
import { addBusinessDays, addCalendarDays, daysBetween, isBusinessDay } from "../../domain/businessDays.js";

/**
 * Funciones PURAS: el test más simple que existe. Sin dobles, sin preparación: entra un dato, sale un resultado.
 * Fechas de referencia (noviembre 2026): mié 4, vie 6, sáb 7, dom 8, lun 9 (feriado en los datos falsos).
 */

describe("addBusinessDays", () => {
  it("suma 10 días hábiles salteando los fines de semana", () => {
    // Arrange: miércoles 4, sin feriados
    // Act
    const result = addBusinessDays("2026-11-04", 10, []);
    // Assert: 5, 6, 9, 10, 11, 12, 13, 16, 17, 18
    expect(result).toBe("2026-11-18");
  });

  it("un feriado corre el vencimiento un día", () => {
    expect(addBusinessDays("2026-11-04", 10, ["2026-11-09"])).toBe("2026-11-19");
  });

  // it.each: la MISMA prueba con distintos datos. Cada fila aparece como un test aparte en el reporte.
  it.each([
    // [desde, días, feriados, esperado, descripción]
    ["2026-11-06", 1, [], "2026-11-09", "de viernes a lunes"],
    ["2026-11-07", 1, [], "2026-11-09", "empezando un sábado"],
    ["2026-11-08", 1, [], "2026-11-09", "empezando un domingo"],
    ["2026-11-06", 1, ["2026-11-09"], "2026-11-10", "fin de semana largo"],
    ["2026-11-04", 0, [], "2026-11-04", "cero días no mueve la fecha"],
    ["2026-12-20", 10, ["2026-12-25", "2027-01-01"], "2027-01-05", "cruzando el fin de año"],
    ["2028-02-25", 3, [], "2028-03-01", "cruzando un 29 de febrero"],
  ])("desde %s + %i días hábiles (feriados %j) → %s (%s)", (desde, dias, feriados, esperado) => {
    expect(addBusinessDays(desde, dias, feriados)).toBe(esperado);
  });

  it("el día de inicio no cuenta, aunque sea hábil", () => {
    expect(addBusinessDays("2026-11-04", 1, [])).toBe("2026-11-05");
  });

  it("los feriados que caen en fin de semana no restan nada", () => {
    expect(addBusinessDays("2026-11-06", 1, ["2026-11-07", "2026-11-08"])).toBe("2026-11-09");
  });
});

describe("isBusinessDay", () => {
  it.each([
    ["2026-11-04", true],  // miércoles
    ["2026-11-07", false], // sábado
    ["2026-11-08", false], // domingo
    ["2026-11-09", false], // feriado
  ])("%s → %s", (fecha, esperado) => {
    expect(isBusinessDay(fecha, new Set(["2026-11-09"]))).toBe(esperado);
  });
});

describe("addCalendarDays y daysBetween", () => {
  it("suma días corridos, cruzando meses y años", () => {
    expect(addCalendarDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("daysBetween es la diferencia en días corridos (puede ser negativa)", () => {
    expect(daysBetween("2026-11-18", "2026-11-25")).toBe(7);
    expect(daysBetween("2026-11-25", "2026-11-18")).toBe(-7);
    expect(daysBetween("2026-11-18", "2026-11-18")).toBe(0);
  });
});
