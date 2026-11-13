import { describe, it, expect, vi } from "vitest";
import { BooksMemoryDao } from "../../../dao/books/BooksMemoryDao.js";
import importBooks from "../../../usecases/books/importBooks.js";
import AppError from "../../../errors/AppError.js";

/**
 * importBooks depende de un catálogo EXTERNO (Open Library). En el test lo reemplazamos por un stub
 * que responde según el ISBN: así probamos los cuatro destinos del informe sin red y sin esperar.
 */
const ENCONTRADO = "9780060883287";
const INEXISTENTE = "9780306406157";
const ROMPE = "9780000000040";
const YA_CARGADO = "9780156012195";

function buildCatalogStub() {
  return {
    getByIsbn: vi.fn(async (isbn) => {
      if (isbn === ENCONTRADO) return { titulo: "Cien años de soledad", autores: ["Gabriel García Márquez"] };
      if (isbn === ROMPE) throw new AppError("EXTERNAL_API_ERROR", "Open Library respondió 500", 502);
      return null;
    }),
  };
}

describe("importBooks", () => {
  it("arma el informe con importados, omitidos, no encontrados y fallidos", async () => {
    const dao = new BooksMemoryDao([{ id: 1, titulo: "El principito", autor: "X", isbn: YA_CARGADO, stock: 1 }]);
    const catalog = buildCatalogStub();
    // createBook también se inyecta: acá un espía que guarda directo en el DAO
    const createBook = vi.fn((data) => dao.save(data));

    const report = await importBooks(
      { isbns: [ENCONTRADO, YA_CARGADO, INEXISTENTE, ROMPE], stock: 2 },
      dao,
      catalog,
      createBook,
      2
    );

    expect(report.imported).toMatchObject([{ titulo: "Cien años de soledad", autor: "Gabriel García Márquez", stock: 2 }]);
    expect(report.skipped).toEqual([{ isbn: YA_CARGADO, reason: "ISBN_DUPLICATE" }]);
    expect(report.notFound).toEqual([{ isbn: INEXISTENTE }]);
    expect(report.failed).toEqual([{ isbn: ROMPE, code: "EXTERNAL_API_ERROR", message: "Open Library respondió 500" }]);
  });

  it("no consulta la red por un ISBN que ya está en la base", async () => {
    const dao = new BooksMemoryDao([{ id: 1, titulo: "El principito", autor: "X", isbn: YA_CARGADO, stock: 1 }]);
    const catalog = buildCatalogStub();

    await importBooks({ isbns: [YA_CARGADO], stock: 1 }, dao, catalog, vi.fn(), 3);

    expect(catalog.getByIsbn).not.toHaveBeenCalled();
  });

  it("un ISBN repetido en la lista se consulta una sola vez", async () => {
    const dao = new BooksMemoryDao([]);
    const catalog = buildCatalogStub();

    await importBooks({ isbns: [ENCONTRADO, ENCONTRADO], stock: 1 }, dao, catalog, vi.fn((d) => dao.save(d)), 3);

    expect(catalog.getByIsbn).toHaveBeenCalledTimes(1);
  });
});
