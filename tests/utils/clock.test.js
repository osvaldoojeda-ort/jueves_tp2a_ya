import { describe, it, expect } from "vitest";
import createClock from "../../utils/clock.js";

describe("createClock", () => {
  it("con fixedNow, now() devuelve siempre ese instante", () => {
    const clock = createClock({ fixedNow: "2026-11-04T15:00:00Z" });

    expect(clock.now().toISOString()).toBe("2026-11-04T15:00:00.000Z");
    expect(clock.now()).toEqual(clock.now()); // mismas entradas, misma salida: determinista
  });

  // El caso que justifica la zona horaria fija: en UTC ya es jueves, pero en la biblioteca todavía es miércoles
  it("today() usa la zona horaria de la biblioteca, no UTC", () => {
    const clock = createClock({ fixedNow: "2026-11-05T02:30:00Z" }); // 23:30 del 4 en Buenos Aires

    expect(clock.today()).toBe("2026-11-04");
  });

  it("startOfDay() devuelve el instante en que empieza el día en Buenos Aires (03:00 UTC)", () => {
    const clock = createClock();

    expect(clock.startOfDay("2026-11-04").toISOString()).toBe("2026-11-04T03:00:00.000Z");
  });

  it("rechaza un fixedNow inválido al crearse (falla ruidosamente al arrancar)", () => {
    // Para errores SÍNCRONOS se pasa una FUNCIÓN a expect: si llamáramos createClock(...) directo,
    // el error saltaría antes de que expect pudiera atraparlo.
    expect(() => createClock({ fixedNow: "mañana" })).toThrow(/no es una fecha válida/);
  });

  it("sin fixedNow usa la hora real", () => {
    const antes = Date.now();
    const ahora = createClock().now().getTime();

    expect(ahora).toBeGreaterThanOrEqual(antes);
  });
});
