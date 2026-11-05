// scripts/concurrencyDemo.js — Ejercicio 5.5 de la consigna: node scripts/concurrencyDemo.js
import mapWithConcurrency from "../utils/mapWithConcurrency.js";

const LIMIT = 3;
let active = 0;
let maxActive = 0;

const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], LIMIT, async (n) => {
  active++;
  maxActive = Math.max(maxActive, active);
  await new Promise((resolve) => setTimeout(resolve, 100)); // simula un pedido de red
  active--;
  if (n === 4) throw new Error("falla simulada en el elemento 4");
  return n * 2;
});

console.log(`Límite: ${LIMIT} | máximo de pedidos simultáneos observado: ${maxActive}`);
console.log("Resultados, en el orden original:");
results.forEach((r, i) => console.log(`  #${i + 1}:`, r.status === "fulfilled" ? r.value : `ERROR (${r.reason.message})`));
// Un elemento que falla NO cancela a los demás, y el orden del resultado coincide con el de la entrada.
