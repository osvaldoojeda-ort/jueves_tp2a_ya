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

  // Clase 15: este bug apareció AL DOCUMENTAR los errores de PUT /books/:id ("¿y si mando el ISBN de otro libro?").
  // En memoria quedaban dos libros con el mismo ISBN; con Sequelize, el índice único respondía un 500.
  describe("ISBN duplicado (bug encontrado al documentar)", () => {
    beforeEach(async () => {
      await dao.save({ titulo: "Ficciones", autor: "Borges", isbn: "9789500700122", stock: 3 });
    });

    it("el ISBN de OTRO libro → 409 ISBN_DUPLICATE, sin tocar el libro", async () => {
      await expect(updateBook(1, { isbn: "9789500700122" }, dao, events, 2)).rejects.toMatchObject({
        code: "ISBN_DUPLICATE",
        statusCode: 409,
      });
      expect((await dao.getById(1)).isbn).toBeNull();
    });

    it("reenviar el ISBN que el libro YA tiene no es un duplicado", async () => {
      const updated = await updateBook(2, { isbn: "9789500700122", stock: 4 }, dao, events, 2);

      expect(updated).toMatchObject({ id: 2, isbn: "9789500700122", stock: 4 });
    });
  });
});
