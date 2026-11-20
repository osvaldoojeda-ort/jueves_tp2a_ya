import { describe, it, expect } from "vitest";
import exportBooksCsv from "../../../usecases/books/exportBooksCsv.js";
import createClock from "../../../utils/clock.js";

/**
 * Clase 15: este test nació del checklist de buenas prácticas ("los casos de uso no llaman a new Date()").
 * exportBooksCsv armaba el nombre del archivo con new Date().toISOString(), que es la fecha en UTC:
 * un CSV exportado a las 22:30 en Buenos Aires salía con el nombre del día SIGUIENTE.
 */
const BOOKS = [{ id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: "9780156012195", stock: 3 }];
const getBooks = async () => BOOKS;
const catalog = { getManyByIsbn: async () => ({}) };

describe("exportBooksCsv", () => {
  it("el nombre del archivo usa el día de la biblioteca, no el de UTC", async () => {
    // 22:30 del 4/11 en Buenos Aires = 01:30 del 5/11 en UTC
    const clock = createClock({ fixedNow: "2026-11-04T22:30:00-03:00" });

    const { filename } = await exportBooksCsv({}, getBooks, catalog, clock);

    expect(filename).toBe("libros-2026-11-04.csv");
  });

  it("sin enriquecer no consulta el catálogo e informa 'skipped'", async () => {
    const clock = createClock({ fixedNow: "2026-11-04T12:00:00-03:00" });
    const failingCatalog = { getManyByIsbn: async () => { throw new Error("no debería llamarse"); } };

    const { enrichment, csv } = await exportBooksCsv({}, getBooks, failingCatalog, clock);

    expect(enrichment).toBe("skipped");
    expect(csv).toContain("El principito");
  });
});
