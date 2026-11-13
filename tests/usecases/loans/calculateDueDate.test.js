import { describe, it, expect, vi } from "vitest";
import calculateDueDate from "../../../usecases/loans/calculateDueDate.js";
import AppError from "../../../errors/AppError.js";

/**
 * calculateDueDate recibe el gateway de feriados por parámetro. En estos tests no usamos ni el real ni el falso
 * del proyecto: armamos un STUB con vi.fn() que devuelve justo lo que cada test necesita, y además registra
 * con qué argumentos lo llamaron (para verificar QUÉ años se pidieron).
 */
const holidaysStub = (porAnio = {}) => ({
  getHolidays: vi.fn(async (year) => porAnio[year] ?? []),
});

describe("calculateDueDate", () => {
  it("aplica los feriados que devuelve el gateway", async () => {
    const holidays = holidaysStub({ 2026: ["2026-11-09"] });

    const result = await calculateDueDate({ fromDate: "2026-11-04", businessDays: 10, holidays });

    expect(result).toEqual({ fechaVencimiento: "2026-11-19", holidaysAvailable: true });
  });

  it("un plazo que cruza el fin de año usa los feriados de los DOS años", async () => {
    const holidays = holidaysStub({ 2026: ["2026-12-25"], 2027: ["2027-01-01"] });

    const result = await calculateDueDate({ fromDate: "2026-12-20", businessDays: 10, holidays });

    expect(holidays.getHolidays).toHaveBeenCalledWith(2026);
    expect(holidays.getHolidays).toHaveBeenCalledWith(2027);
    expect(result.fechaVencimiento).toBe("2027-01-05");
  });

  it("a principios de año alcanza con pedir un solo año", async () => {
    const holidays = holidaysStub();

    await calculateDueDate({ fromDate: "2026-03-02", businessDays: 10, holidays });

    expect(holidays.getHolidays).toHaveBeenCalledTimes(1);
    expect(holidays.getHolidays).toHaveBeenCalledWith(2026);
  });

  it("si la API falla con un AppError, degrada: solo fines de semana y holidaysAvailable: false", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const holidays = { getHolidays: vi.fn().mockRejectedValue(new AppError("EXTERNAL_TIMEOUT", "timeout", 504)) };

    const result = await calculateDueDate({ fromDate: "2026-11-04", businessDays: 10, holidays });

    expect(result).toEqual({ fechaVencimiento: "2026-11-18", holidaysAvailable: false });
  });

  it("un error que no es AppError se propaga (no se esconden los bugs)", async () => {
    const holidays = { getHolidays: vi.fn().mockRejectedValue(new ReferenceError("feriados is not defined")) };

    await expect(calculateDueDate({ fromDate: "2026-11-04", businessDays: 10, holidays })).rejects.toThrow(ReferenceError);
  });
});
