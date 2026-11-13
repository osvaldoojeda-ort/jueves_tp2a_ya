import { describe, it, expect } from "vitest";
import mapWithConcurrency from "../../utils/mapWithConcurrency.js";

// Una espera corta para simular un pedido a una API
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapWithConcurrency", () => {
  it("nunca ejecuta más de `limit` tareas al mismo tiempo", async () => {
    let enCurso = 0;
    let maximo = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, async (n) => {
      enCurso++;
      maximo = Math.max(maximo, enCurso);
      await wait(5);
      enCurso--;
      return n;
    });

    expect(maximo).toBe(3);
  });

  it("devuelve los resultados en el MISMO orden, con la forma de Promise.allSettled", async () => {
    // El primero tarda más que el resto: si el orden dependiera de quién termina primero, este test fallaría
    const result = await mapWithConcurrency([30, 1, 1], 3, async (ms) => {
      await wait(ms);
      return ms * 2;
    });

    expect(result).toEqual([
      { status: "fulfilled", value: 60 },
      { status: "fulfilled", value: 2 },
      { status: "fulfilled", value: 2 },
    ]);
  });

  it("un elemento que falla no cancela a los demás", async () => {
    const result = await mapWithConcurrency(["ok", "falla", "ok"], 2, async (x) => {
      if (x === "falla") throw new Error("boom");
      return x;
    });

    expect(result.map((r) => r.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    expect(result[1].reason.message).toBe("boom");
  });

  it("con una lista vacía devuelve un arreglo vacío", async () => {
    expect(await mapWithConcurrency([], 3, async (x) => x)).toEqual([]);
  });
});
