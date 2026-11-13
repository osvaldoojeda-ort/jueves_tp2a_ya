import { describe, it, expect } from "vitest";
import { escapeCell, toCsv } from "../../utils/csv.js";

describe("escapeCell", () => {
  it.each([
    ["texto simple", "texto simple"],
    ["Hola, mundo", '"Hola, mundo"'],               // tiene el separador → entre comillas
    ['Hola, "mundo"', '"Hola, ""mundo"""'],         // comillas internas duplicadas
    ["dos\nlíneas", '"dos\nlíneas"'],               // salto de línea → entre comillas
    ["=HYPERLINK(\"http://x\")", "\"'=HYPERLINK(\"\"http://x\"\")\""], // inyección de fórmulas neutralizada
    ["@SUMA(A1)", "'@SUMA(A1)"],
  ])("%j → %j", (entrada, esperado) => {
    expect(escapeCell(entrada)).toBe(esperado);
  });

  it("los números negativos NO se tocan (solo se protegen los textos)", () => {
    expect(escapeCell(-5)).toBe("-5");
  });

  it("un texto que empieza con - SÍ se protege", () => {
    expect(escapeCell("-5")).toBe("'-5");
  });

  it("null y undefined son celdas vacías", () => {
    expect(escapeCell(null)).toBe("");
    expect(escapeCell(undefined)).toBe("");
  });

  it("con separador ';' la coma ya no obliga a usar comillas", () => {
    expect(escapeCell("1,5", ";")).toBe("1,5");
    expect(escapeCell("a;b", ";")).toBe('"a;b"');
  });
});

describe("toCsv", () => {
  const columns = [
    { header: "id", value: (r) => r.id },
    { header: "titulo", value: (r) => r.titulo },
  ];

  it("arma BOM + encabezado + filas, separadas por \\r\\n", () => {
    const csv = toCsv([{ id: 1, titulo: "El principito" }, { id: 2, titulo: "Hola, mundo" }], columns);

    expect(csv).toBe('﻿id,titulo\r\n1,El principito\r\n2,"Hola, mundo"\r\n');
  });

  it("sin filas devuelve solo el encabezado", () => {
    expect(toCsv([], columns)).toBe("﻿id,titulo\r\n");
  });
});
