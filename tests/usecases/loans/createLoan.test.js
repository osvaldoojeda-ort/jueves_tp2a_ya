import { describe, it, expect, vi } from "vitest";
import { buildLoanScenario, ANA, BETO, ADMIN } from "../../helpers/loanScenario.js";
import createFakeHolidays from "../../../gateways/fakeHolidays.js";
import EVENTS from "../../../events/eventNames.js";

/**
 * createLoan: el caso de uso con más reglas del proyecto.
 * Sin base, sin red, sin servidor: DAOs en memoria, reloj fijo (miércoles 2026-11-04) y feriados falsos.
 *
 * Para cada regla, los cuatro casos de la clase 13:
 *   1. el feliz   2. el borde   3. el que la viola (con su `code`)   4. que el estado NO cambió tras el rechazo
 */

describe("createLoan", () => {
  describe("caso feliz", () => {
    it("presta el libro, calcula el vencimiento en días hábiles y descuenta stock", async () => {
      // Arrange
      const { useCases, stockOf } = buildLoanScenario();

      // Act
      const loan = await useCases.createLoan({ bookId: 1 }, ANA);

      // Assert
      expect(loan).toMatchObject({
        userId: ANA.id,
        bookId: 1,
        fechaVencimiento: "2026-11-19", // 10 hábiles desde el 4, con el feriado del 9 (datos falsos)
        estado: "activo",
        diasAtraso: 0,
        renovaciones: 0,
        holidaysAvailable: true,
      });
      expect(await stockOf(1)).toBe(4);
    });

    it("la fecha de préstamo la pone el reloj inyectado, no la hora real", async () => {
      const { useCases } = buildLoanScenario({ now: "2027-03-01T10:00:00-03:00" });

      const loan = await useCases.createLoan({ bookId: 1 }, ANA);

      expect(loan.fechaPrestamo).toEqual(new Date("2027-03-01T10:00:00-03:00"));
    });
  });

  describe("permisos y existencia", () => {
    it("un lector no puede pedir a nombre de otro (403 FORBIDDEN)", async () => {
      const { useCases } = buildLoanScenario();

      // Con async: se espera la PROMESA con `await expect(...).rejects`. Sin el await, el test pasaría siempre.
      await expect(useCases.createLoan({ bookId: 1, userId: BETO.id }, ANA)).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
    });

    it("el admin sí puede prestar a nombre de otro usuario", async () => {
      const { useCases } = buildLoanScenario();

      const loan = await useCases.createLoan({ bookId: 1, userId: BETO.id }, ADMIN);

      expect(loan.userId).toBe(BETO.id);
    });

    it("usuario inexistente → 404 USER_NOT_FOUND", async () => {
      const { useCases } = buildLoanScenario();

      await expect(useCases.createLoan({ bookId: 1, userId: 500 }, ADMIN)).rejects.toMatchObject({
        code: "USER_NOT_FOUND",
        statusCode: 404,
      });
    });

    it("libro inexistente → 404 BOOK_NOT_FOUND", async () => {
      const { useCases } = buildLoanScenario();

      await expect(useCases.createLoan({ bookId: 999 }, ANA)).rejects.toMatchObject({
        code: "BOOK_NOT_FOUND",
        statusCode: 404,
      });
    });
  });

  describe("estado del libro", () => {
    it("no puede pedir dos veces el mismo libro sin devolverlo (409 ALREADY_LOANED)", async () => {
      const { useCases } = buildLoanScenario();
      await useCases.createLoan({ bookId: 1 }, ANA);

      await expect(useCases.createLoan({ bookId: 1 }, ANA)).rejects.toMatchObject({ code: "ALREADY_LOANED" });
    });

    it("sin stock → 409 OUT_OF_STOCK y no queda ningún préstamo registrado", async () => {
      const { useCases, loansDao, stockOf } = buildLoanScenario();

      await expect(useCases.createLoan({ bookId: 6 }, ANA)).rejects.toMatchObject({
        code: "OUT_OF_STOCK",
        statusCode: 409,
      });
      expect(await loansDao.getAll({ userId: ANA.id })).toHaveLength(0);
      expect(await stockOf(6)).toBe(0);
    });
  });

  describe("R1 — como máximo 3 préstamos activos", () => {
    it("borde: con 2 activos, el tercero se presta", async () => {
      const { useCases } = buildLoanScenario();
      await useCases.createLoan({ bookId: 1 }, ANA);
      await useCases.createLoan({ bookId: 2 }, ANA);

      await expect(useCases.createLoan({ bookId: 3 }, ANA)).resolves.toMatchObject({ bookId: 3 });
    });

    it("con 3 activos, el cuarto se rechaza con 409 LOAN_LIMIT_REACHED y el mensaje dice el límite", async () => {
      const { useCases } = buildLoanScenario();
      for (const bookId of [1, 2, 3]) await useCases.createLoan({ bookId }, ANA);

      await expect(useCases.createLoan({ bookId: 4 }, ANA)).rejects.toMatchObject({
        code: "LOAN_LIMIT_REACHED",
        statusCode: 409,
        message: expect.stringContaining("3"),
      });
    });

    it("tras el rechazo, el estado no cambió: ni stock ni préstamos", async () => {
      const { useCases, loansDao, stockOf } = buildLoanScenario();
      for (const bookId of [1, 2, 3]) await useCases.createLoan({ bookId }, ANA);

      await useCases.createLoan({ bookId: 4 }, ANA).catch(() => {}); // sabemos que falla: miramos lo que dejó

      expect(await stockOf(4)).toBe(5);
      expect(await loansDao.getAll({ userId: ANA.id, activos: true })).toHaveLength(3);
    });

    it("los préstamos devueltos no cuentan para el límite", async () => {
      const { useCases, givenLoan } = buildLoanScenario();
      await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-01", devueltoEl: "2026-10-20" });
      await useCases.createLoan({ bookId: 2 }, ANA);
      await useCases.createLoan({ bookId: 3 }, ANA);

      await expect(useCases.createLoan({ bookId: 4 }, ANA)).resolves.toBeDefined();
    });

    it("el límite es de cada usuario: que Ana llegue al tope no afecta a Beto", async () => {
      const { useCases } = buildLoanScenario();
      for (const bookId of [1, 2, 3]) await useCases.createLoan({ bookId }, ANA);

      await expect(useCases.createLoan({ bookId: 1 }, BETO)).resolves.toBeDefined();
    });

    it("el tope es configuración: con maxActive = 1, el segundo ya se rechaza", async () => {
      const { useCases } = buildLoanScenario({ loanRules: { maxActive: 1 } });
      await useCases.createLoan({ bookId: 1 }, ANA);

      await expect(useCases.createLoan({ bookId: 2 }, ANA)).rejects.toMatchObject({
        code: "LOAN_LIMIT_REACHED",
        message: expect.stringContaining("1"),
      });
    });
  });

  describe("R3 — con un préstamo vencido no se puede pedir otro", () => {
    it("rechaza con 409 USER_HAS_OVERDUE_LOANS e informa cuáles están vencidos en details", async () => {
      const { useCases, givenLoan } = buildLoanScenario(); // hoy: 2026-11-04
      const vencido = await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-03" });

      await expect(useCases.createLoan({ bookId: 2 }, ANA)).rejects.toMatchObject({
        code: "USER_HAS_OVERDUE_LOANS",
        statusCode: 409,
        details: [{ loanId: vencido.id, bookId: 1, fechaVencimiento: "2026-11-03" }],
      });
    });

    it("borde: si vence HOY todavía no está vencido, y puede pedir otro", async () => {
      const { useCases, givenLoan } = buildLoanScenario();
      await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-04" });

      await expect(useCases.createLoan({ bookId: 2 }, ANA)).resolves.toBeDefined();
    });

    it("el mismo préstamo pasa a estar vencido si 'viajamos' un día al futuro", async () => {
      const { useCases, givenLoan } = buildLoanScenario({ now: "2026-11-05T09:00:00-03:00" });
      await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-11-04" });

      await expect(useCases.createLoan({ bookId: 2 }, ANA)).rejects.toMatchObject({ code: "USER_HAS_OVERDUE_LOANS" });
    });

    it("un vencido que ya se devolvió no bloquea", async () => {
      const { useCases, givenLoan } = buildLoanScenario();
      await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-15", devueltoEl: "2026-10-30" });

      await expect(useCases.createLoan({ bookId: 2 }, ANA)).resolves.toBeDefined();
    });

    it("orden: si está en el tope Y tiene uno vencido, gana R3 (el mensaje útil es 'devolvelo')", async () => {
      const { useCases, givenLoan } = buildLoanScenario();
      await givenLoan({ userId: ANA.id, bookId: 1, fechaVencimiento: "2026-10-30" });
      await givenLoan({ userId: ANA.id, bookId: 2, fechaVencimiento: "2026-11-20" });
      await givenLoan({ userId: ANA.id, bookId: 3, fechaVencimiento: "2026-11-20" });

      await expect(useCases.createLoan({ bookId: 4 }, ANA)).rejects.toMatchObject({ code: "USER_HAS_OVERDUE_LOANS" });
    });
  });

  describe("R2 — feriados (un gateway externo)", () => {
    it("fail fast: si una regla rechaza el pedido, NO se consulta la API de feriados", async () => {
      const { useCases, holidays } = buildLoanScenario();
      // spyOn "envuelve" el método real: sigue funcionando igual, pero registra cada llamada
      const spy = vi.spyOn(holidays, "getHolidays");
      for (const bookId of [1, 2, 3]) await useCases.createLoan({ bookId }, ANA);
      spy.mockClear(); // olvidamos las llamadas de la preparación

      await useCases.createLoan({ bookId: 4 }, ANA).catch(() => {});

      expect(spy).not.toHaveBeenCalled();
    });

    it("si la API de feriados está caída, presta igual contando solo fines de semana (degradación)", async () => {
      const { useCases } = buildLoanScenario({ holidays: createFakeHolidays({ fail: true }) });
      // calculateDueDate avisa por consola: lo silenciamos para que no ensucie la salida de los tests
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const loan = await useCases.createLoan({ bookId: 1 }, ANA);

      expect(loan).toMatchObject({ fechaVencimiento: "2026-11-18", holidaysAvailable: false });
      expect(warn).toHaveBeenCalledOnce();
    });

    it("un error que NO es de la API (un bug propio) no se oculta", async () => {
      // Stub: un objeto escrito a mano con el mismo contrato, que hace exactamente lo que el test necesita
      const holidaysRoto = { getHolidays: vi.fn().mockRejectedValue(new TypeError("x is not a function")) };
      const { useCases, stockOf } = buildLoanScenario({ holidays: holidaysRoto });

      await expect(useCases.createLoan({ bookId: 1 }, ANA)).rejects.toThrow(TypeError);
      expect(await stockOf(1)).toBe(5); // y no se prestó nada
    });
  });

  describe("evento de stock bajo", () => {
    it("si el stock queda en el umbral, emite book.lowStock con los datos del libro", async () => {
      const { useCases, events } = buildLoanScenario({ lowStockThreshold: 4 });
      const listener = vi.fn(); // un espía "vacío": no hace nada, solo registra cómo lo llamaron
      events.on(EVENTS.BOOK_LOW_STOCK, listener);

      await useCases.createLoan({ bookId: 1 }, ANA); // stock 5 → 4

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith({ id: 1, titulo: "Libro 1", stock: 4 });
    });

    it("si el stock queda por encima del umbral, no emite nada", async () => {
      const { useCases, events } = buildLoanScenario({ lowStockThreshold: 3 });
      const listener = vi.fn();
      events.on(EVENTS.BOOK_LOW_STOCK, listener);

      await useCases.createLoan({ bookId: 1 }, ANA); // stock 5 → 4

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
