// scripts/sinFramework.js — solo para entender la idea
// Correr con: node scripts/sinFramework.js
//
// Un "test" no es magia: es llamar a una función con datos conocidos
// y comparar lo que devuelve con lo que esperamos.
// Si coincide, no pasa nada. Si no coincide, assert tira un error y el script se corta.
import assert from "node:assert";
import { addBusinessDays } from "../domain/businessDays.js";

// ---------- 1) El ejemplo más tonto posible ----------
function sumar(a, b) {
  return a + b;
}

assert.strictEqual(sumar(2, 3), 5);     // caso normal
assert.strictEqual(sumar(-1, 1), 0);    // con negativos
assert.strictEqual(sumar(0, 0), 0);     // con ceros
assert.strictEqual(sumar(1.5, 2.5), 4); // con decimales
console.log("sumar: OK");

// Probá romperlo: cambiá el 5 por un 6 en la primera línea y volvé a correr.
// Vas a ver un AssertionError con "expected 6, actual 5".

// ---------- 2) Lo mismo, pero con una función real del dominio ----------
assert.strictEqual(addBusinessDays("2026-11-04", 10, []), "2026-11-18");
assert.strictEqual(addBusinessDays("2026-11-04", 10, ["2026-11-09"]), "2026-11-19");
console.log("addBusinessDays: OK");

console.log("todo OK");
