import { describe, it, expect, vi, beforeEach } from "vitest";
import { BooksMemoryDao } from "../../../dao/books/BooksMemoryDao.js";
import updateBook from "../../../usecases/books/updateBook.js";
import EVENTS from "../../../events/eventNames.js";

let dao;
let events;

beforeEach(() => {
  dao = new BooksMemoryDao([{ id: 1, titulo: "El principito", autor: "Saint-Exupéry", isbn: null, stock: 1 }]);
  events = { emit: vi.fn() };
});

describe("updateBook", () => {
  it("stock negativo → 400 INVALID_STOCK, sin tocar el libro", async () => {
    await expect(updateBook(1, { stock: -1 }, dao, events, 2)).rejects.toMatchObject({
      code: "INVALID_STOCK",
      statusCode: 400,
    });
    expect((await dao.getById(1)).stock).toBe(1);
  });

  it("un libro que no existe devuelve null (el 404 lo decide el controller)", async () => {
    expect(await updateBook(99, { titulo: "X" }, dao, events, 2)).toBeNull();
  });

  it("si el cambio deja el stock bajo, emite book.lowStock", async () => {
    await updateBook(1, { stock: 2 }, dao, events, 2);

    expect(events.emit).toHaveBeenCalledWith(EVENTS.BOOK_LOW_STOCK, { id: 1, titulo: "El principito", stock: 2 });
  });

  it("editar solo el título NO vuelve a avisar, aunque el stock ya sea bajo", async () => {
    await updateBook(1, { titulo: "The Little Prince" }, dao, events, 2);

    expect(events.emit).not.toHaveBeenCalled();
  });
});
