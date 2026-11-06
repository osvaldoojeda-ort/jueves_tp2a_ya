// scripts/businessDaysDemo.js — Ejercicio 3.5 de la consigna: node scripts/businessDaysDemo.js
// Todo lo de acá es PURO: no hay base, ni red, ni new Date() "de verdad". Por eso los resultados son siempre los mismos.
import { addBusinessDays } from "../domain/businessDays.js";
import { isOverdue, withStatus } from "../domain/loanStatus.js";
import createClock from "../utils/clock.js";
import { hasValidIsbn13Checksum } from "../utils/isbn.js";

const holidays = ["2026-11-09", "2026-11-23", "2026-12-07", "2026-12-08", "2026-12-25", "2027-01-01"];

console.log("== R2: 10 días hábiles ==");
console.log("Desde el miércoles 2026-11-04, sin feriados:", addBusinessDays("2026-11-04", 10, []), "(esperado 2026-11-18)");
console.log("Desde el miércoles 2026-11-04, con feriados:", addBusinessDays("2026-11-04", 10, holidays), "(esperado 2026-11-19)");
console.log("Desde un viernes (2026-11-06), 1 día hábil:", addBusinessDays("2026-11-06", 1, holidays), "(esperado 2026-11-10: salta el finde y el 9)");
console.log("Cruzando el fin de año (2026-12-20):", addBusinessDays("2026-12-20", 10, holidays), "(esperado 2027-01-05)");

console.log("\n== R3: vencido es un estado calculado ==");
const loan = { id: 1, fechaVencimiento: "2026-11-18", fechaDevolucion: null };
for (const today of ["2026-11-17", "2026-11-18", "2026-11-19"]) {
  const { estado, diasAtraso } = withStatus(loan, today);
  console.log(`Hoy ${today}: isOverdue=${isOverdue(loan, today)} estado=${estado} diasAtraso=${diasAtraso}`);
}
console.log("(el mismo día del vencimiento todavía NO está vencido: el borde importa)");

console.log("\n== El reloj inyectado ==");
// 2026-11-05T02:30Z es el 4/11 a las 23:30 en Buenos Aires: en UTC ya es "mañana"
const clock = createClock({ fixedNow: "2026-11-05T02:30:00Z" });
console.log("Instante:", clock.now().toISOString(), "→ hoy en la biblioteca:", clock.today(), "(no 2026-11-05)");

console.log("\n== R5: dígito de control del ISBN ==");
for (const isbn of ["9780156012195", "9780156012196", "9789875660014"]) {
  console.log(isbn, hasValidIsbn13Checksum(isbn) ? "válido" : "INVÁLIDO");
}
