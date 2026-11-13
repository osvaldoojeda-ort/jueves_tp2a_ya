import { describe, it, expect } from "vitest";
import { hasValidIsbn13Checksum } from "../../utils/isbn.js";

describe("hasValidIsbn13Checksum", () => {
  it.each([
    "9780156012195", // El principito
    "9780060883287", // Cien años de soledad
    "9780306406157", // dígito de control 7
    "9780000000002", // suma múltiplo de 10 + 2
  ])("acepta el ISBN válido %s", (isbn) => {
    expect(hasValidIsbn13Checksum(isbn)).toBe(true);
  });

  it.each([
    "9780156012196", // último dígito cambiado
    "9780156012190",
    "9870156012195", // dos dígitos intercambiados: el peso 1/3 lo detecta
  ])("rechaza el ISBN inválido %s", (isbn) => {
    expect(hasValidIsbn13Checksum(isbn)).toBe(false);
  });

  // Borde: cuando la suma ya es múltiplo de 10, el dígito de control es 0 (no 10).
  // Una implementación que olvida el último "% 10" falla SOLO con estos ISBN: por eso merecen su propio test.
  it("si la suma es múltiplo de 10, el dígito de control es 0", () => {
    expect(hasValidIsbn13Checksum("9780000000040")).toBe(true);
  });
});
