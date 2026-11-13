import { describe, it, expect, vi, beforeEach } from "vitest";
import { BooksMemoryDao } from "../../../dao/books/BooksMemoryDao.js";
import createBook from "../../../usecases/books/createBook.js";
import EVENTS from "../../../events/eventNames.js";

/**
 * createBook en la clase 13 importaba LOW_STOCK_THRESHOLD de config.js, y config.js lanza un error si falta
 * JWT_SECRET: este archivo de test explotaba ANTES de correr un solo test. El test nos mostró un acoplamiento,
 * y la solución fue la de siempre: inyectar el umbral. Ahora el caso de uso recibe (data, dao, events, lowStockThreshold).
 *
 * Acá usamos beforeEach en lugar de un helper: cada test arranca con un DAO y un espía NUEVOS.
 */

let dao;
let events;

beforeEach(() => {
  dao = new BooksMemoryDao([{ id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: "9780156012195", stock: 3 }]);
  // No hace falta un EventEmitter de verdad: alcanza con un objeto que tenga emit() y que registre las llamadas
  events = { emit: vi.fn() };
});

describe("createBook", () => {
  it("guarda el libro y le asigna un id", async () => {
    const created = await createBook({ titulo: "Rayuela", autor: "Cortázar", stock: 10 }, dao, events, 2);

    expect(created).toMatchObject({ id: 2, titulo: "Rayuela", isbn: null });
    expect(await dao.getById(2)).toEqual(created);
  });

  it("ISBN repetido → 409 ISBN_DUPLICATE y no se guarda nada", async () => {
    await expect(
      createBook({ titulo: "Copia", autor: "X", isbn: "9780156012195", stock: 1 }, dao, events, 2)
    ).rejects.toMatchObject({ code: "ISBN_DUPLICATE", statusCode: 409 });

    expect(await dao.getAll()).toHaveLength(1);
  });

  it("si nace con stock bajo (≤ umbral), emite book.lowStock", async () => {
    await createBook({ titulo: "Rayuela", autor: "Cortázar", stock: 2 }, dao, events, 2);

    expect(events.emit).toHaveBeenCalledWith(EVENTS.BOOK_LOW_STOCK, { id: 2, titulo: "Rayuela", stock: 2 });
  });

  it("borde: con stock = umbral + 1 no emite nada", async () => {
    await createBook({ titulo: "Rayuela", autor: "Cortázar", stock: 3 }, dao, events, 2);

    expect(events.emit).not.toHaveBeenCalled();
  });

  it("el umbral llega inyectado: con umbral 10, un stock de 5 ya es bajo", async () => {
    await createBook({ titulo: "Rayuela", autor: "Cortázar", stock: 5 }, dao, events, 10);

    expect(events.emit).toHaveBeenCalledOnce();
  });
});
