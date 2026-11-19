import { describe, it, expect, beforeEach, vi } from "vitest";

// Clase 14 - Ejercicio 10.2: el adaptador de Sequelize usa la conexión de connection/sequelize.js, que apunta a
// ./database.sqlite. Para el test la reemplazamos por una base SQLite EN MEMORIA: se crea vacía en cada corrida,
// no toca tu base de desarrollo y es rapidísima. (vi.mock se "eleva" arriba de los imports: corre antes que ellos.)
vi.mock("../../connection/sequelize.js", async () => {
  const { Sequelize } = await import("sequelize");
  return { default: new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false }) };
});

import { BooksMemoryDao } from "../../dao/books/BooksMemoryDao.js";
import { UsersMemoryDao } from "../../dao/users/UsersMemoryDao.js";
import { LoansMemoryDao } from "../../dao/loans/LoansMemoryDao.js";
import { LoansSequelizeDao } from "../../dao/loans/LoansSequelizeDao.js";
import { sequelize, BookModel, UserModel } from "../../dao/models/index.js";

/**
 * TEST DE CONTRATO: los MISMOS tests corren contra los dos adaptadores (describe.each).
 * La arquitectura en capas promete que el caso de uso no se entera de cuál DAO tiene enchufado;
 * este archivo es lo que CUMPLE esa promesa: si un adaptador se comporta distinto, un test lo marca.
 *
 * 10.2 ¿Encontraste alguna diferencia? SÍ: si el usuario ya tenía el ÚLTIMO ejemplar y lo volvía a pedir,
 *   memoria respondía ALREADY_LOANED (chequea el duplicado antes que el stock) y Sequelize devolvía null
 *   (descontaba stock primero, el UPDATE no afectaba filas y nunca llegaba al índice único). El caso de uso
 *   no lo nota porque chequea getActive() antes, pero con dos pedidos simultáneos el usuario recibía un
 *   mensaje distinto según la persistencia. Corrección: Sequelize ahora hace el alta primero (como memoria).
 * Ojo: SQLite ":memory:" sirve para estos tests SECUENCIALES, pero no para probar concurrencia: Sequelize usa
 *   una sola conexión y dos transacciones en paralelo se pisan ("cannot start a transaction within a transaction").
 *   Para pruebas de carrera hace falta un archivo (como hace scripts/integrityDemo.js en la clase 13).
 */

const USERS = [
  { id: 1, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "x" },
  { id: 2, nombre: "Beto", email: "beto@test.com", rol: "lector", passwordHash: "x" },
];
const BOOKS = [
  { id: 1, titulo: "Libro 1", autor: "Autor", isbn: null, stock: 2 },
  { id: 2, titulo: "Último ejemplar", autor: "Autor", isbn: null, stock: 1 },
  { id: 3, titulo: "Agotado", autor: "Autor", isbn: null, stock: 0 },
];

// Cada "adaptador" sabe armar un mundo nuevo con los mismos datos y leer el stock de un libro
const adapters = [
  {
    name: "LoansMemoryDao",
    async setup() {
      const booksDao = new BooksMemoryDao(BOOKS.map((b) => ({ ...b })));
      const usersDao = new UsersMemoryDao(USERS.map((u) => ({ ...u })));
      return { dao: new LoansMemoryDao(booksDao, usersDao), stockOf: async (id) => (await booksDao.getById(id)).stock };
    },
  },
  {
    name: "LoansSequelizeDao (SQLite :memory:)",
    async setup() {
      await sequelize.sync({ force: true }); // borra y recrea las tablas (con el índice único parcial)
      await UserModel.bulkCreate(USERS);
      await BookModel.bulkCreate(BOOKS);
      return { dao: new LoansSequelizeDao(), stockOf: async (id) => (await BookModel.findByPk(id)).stock };
    },
  },
];

const PRESTAMO = { fechaPrestamo: new Date("2026-11-04T12:00:00-03:00"), fechaVencimiento: "2026-11-18" };

describe.each(adapters)("Contrato de LoansDao: $name", ({ setup }) => {
  let dao;
  let stockOf;

  beforeEach(async () => {
    ({ dao, stockOf } = await setup());
  });

  describe("lend", () => {
    it("registra el préstamo activo, con usuario y libro, y descuenta stock", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });

      expect(loan).toMatchObject({
        userId: 1,
        bookId: 1,
        fechaVencimiento: "2026-11-18",
        fechaDevolucion: null,
        renovaciones: 0,
        usuario: { id: 1, nombre: "Ana" },
        libro: { id: 1, titulo: "Libro 1" },
      });
      expect(loan.fechaPrestamo).toEqual(PRESTAMO.fechaPrestamo);
      expect(await stockOf(1)).toBe(1);
    });

    it("sin stock devuelve null y no registra nada", async () => {
      expect(await dao.lend({ userId: 1, bookId: 3, ...PRESTAMO })).toBeNull();
      expect(await dao.getAll()).toHaveLength(0);
      expect(await stockOf(3)).toBe(0);
    });

    it("el mismo usuario con el mismo libro sin devolver → ALREADY_LOANED 409, y el stock no se toca", async () => {
      await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });

      await expect(dao.lend({ userId: 1, bookId: 1, ...PRESTAMO })).rejects.toMatchObject({
        code: "ALREADY_LOANED",
        statusCode: 409,
      });
      expect(await stockOf(1)).toBe(1);
      expect(await dao.getAll()).toHaveLength(1);
    });

    it("una vez devuelto, el mismo usuario puede volver a pedir el mismo libro (el índice es PARCIAL)", async () => {
      const first = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      await dao.giveBack(first.id, new Date("2026-11-05T12:00:00-03:00"));

      await expect(dao.lend({ userId: 1, bookId: 1, ...PRESTAMO })).resolves.toMatchObject({ fechaDevolucion: null });
    });

    it("ya tiene el ÚLTIMO ejemplar y lo vuelve a pedir: ¿ALREADY_LOANED o null por falta de stock?", async () => {
      await dao.lend({ userId: 1, bookId: 2, ...PRESTAMO }); // stock 1 → 0

      await expect(dao.lend({ userId: 1, bookId: 2, ...PRESTAMO })).rejects.toMatchObject({ code: "ALREADY_LOANED" });
    });
  });

  describe("giveBack", () => {
    it("marca la devolución y repone stock", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      const when = new Date("2026-11-10T12:00:00-03:00");

      const returned = await dao.giveBack(loan.id, when);

      expect(returned.fechaDevolucion).toEqual(when);
      expect(await stockOf(1)).toBe(2);
    });

    it("devolver dos veces → la segunda devuelve null y el stock se repone UNA vez", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      await dao.giveBack(loan.id, new Date());

      expect(await dao.giveBack(loan.id, new Date())).toBeNull();
      expect(await stockOf(1)).toBe(2);
    });

    it("un préstamo inexistente devuelve null", async () => {
      expect(await dao.giveBack(999, new Date())).toBeNull();
    });
  });

  describe("renew", () => {
    it("con renovacionesPrevias al día: nuevo vencimiento y renovaciones + 1", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });

      const renewed = await dao.renew(loan.id, { fechaVencimiento: "2026-12-02", renovacionesPrevias: 0 });

      expect(renewed).toMatchObject({ fechaVencimiento: "2026-12-02", renovaciones: 1 });
    });

    it("con renovacionesPrevias DESACTUALIZADO (otro pedido renovó en el medio) → null y no cambia nada", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      await dao.renew(loan.id, { fechaVencimiento: "2026-12-02", renovacionesPrevias: 0 }); // el "otro pedido"

      expect(await dao.renew(loan.id, { fechaVencimiento: "2026-12-16", renovacionesPrevias: 0 })).toBeNull();
      expect(await dao.getById(loan.id)).toMatchObject({ fechaVencimiento: "2026-12-02", renovaciones: 1 });
    });

    it("un préstamo ya devuelto no se renueva → null", async () => {
      const loan = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      await dao.giveBack(loan.id, new Date());

      expect(await dao.renew(loan.id, { fechaVencimiento: "2026-12-02", renovacionesPrevias: 0 })).toBeNull();
    });
  });

  describe("getAll", () => {
    beforeEach(async () => {
      const l1 = await dao.lend({ userId: 1, bookId: 1, ...PRESTAMO });
      await dao.lend({ userId: 2, bookId: 1, ...PRESTAMO, fechaPrestamo: new Date("2026-11-06T12:00:00-03:00") });
      await dao.lend({ userId: 1, bookId: 2, ...PRESTAMO });
      await dao.giveBack(l1.id, new Date());
    });

    it.each([
      ["sin filtros", {}, 3],
      ["por usuario", { userId: 1 }, 2],
      ["por libro", { bookId: 1 }, 2],
      ["varios usuarios (IN)", { userId: [1, 2] }, 3],
      ["activos", { activos: true }, 2],
      ["devueltos", { activos: false }, 1],
      ["prestadoDesde (inclusive)", { prestadoDesde: new Date("2026-11-06T12:00:00-03:00") }, 1],
      ["prestadoAntesDe (exclusive)", { prestadoAntesDe: new Date("2026-11-06T12:00:00-03:00") }, 2],
    ])("%s", async (_, filters, expected) => {
      expect(await dao.getAll(filters)).toHaveLength(expected);
    });
  });
});
