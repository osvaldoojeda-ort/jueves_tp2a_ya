import AppError from "../../errors/AppError.js";
import { addBusinessDays, addCalendarDays } from "../../domain/businessDays.js";

/**
 * Calcula la fecha de vencimiento (regla R2): `businessDays` días hábiles a partir de `fromDate`.
 * Pide los feriados al gateway inyectado y, si la API falla, DEGRADA con elegancia: calcula solo con
 * fines de semana y lo informa (holidaysAvailable: false). Que un tercero esté caído no debe impedir prestar un libro.
 *
 * Ejercicio 9.4 — Si la biblioteca tuviera sedes en dos provincias con feriados distintos:
 *  CAMBIA:
 *   - El contrato del gateway: getHolidays(year, provincia), y su caché pasa a ser por año + provincia
 *     (ArgentinaDatos solo trae los nacionales: los provinciales vendrían de otra fuente o de una tabla propia).
 *   - El modelo: el préstamo (o el ejemplar del libro) necesita saber en qué sede se retira (columna sedeId).
 *   - Este caso de uso y createLoan/renewLoan: reciben la provincia de la sede y se la pasan al gateway.
 *   - Los datos del fake: feriados por provincia.
 *  NO CAMBIA:
 *   - addBusinessDays, isOverdue y withStatus: son puras y reciben la lista de feriados ya armada.
 *   - El reloj: Argentina tiene un solo huso horario (si una sede estuviera en otro país, today() pasaría
 *     a depender de la zona de la sede).
 *   - Las reglas R1, R3, R4 y R5, los status codes, los DAOs (salvo la columna nueva) y el container
 *     (sigue inyectando un único gateway de feriados).
 *
 * @returns {{ fechaVencimiento: string, holidaysAvailable: boolean }}
 */
async function calculateDueDate({ fromDate, businessDays, holidays }) {
  // El plazo puede cruzar el fin de año: se piden todos los años que podría abarcar.
  // Cota conservadora: N días hábiles nunca ocupan más de N * 2 + 30 días corridos.
  const firstYear = Number(fromDate.slice(0, 4));
  const lastYear = Number(addCalendarDays(fromDate, businessDays * 2 + 30).slice(0, 4));
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  let holidayDates = [];
  let holidaysAvailable = true;
  try {
    const lists = await Promise.all(years.map((year) => holidays.getHolidays(year)));
    holidayDates = lists.flat();
  } catch (err) {
    // Igual que en la clase 12: solo se degrada ante una falla CONOCIDA del tercero. Un bug propio no se oculta.
    if (!(err instanceof AppError)) throw err;
    console.warn(`[Feriados] No disponibles (${err.code}): el vencimiento se calcula solo con fines de semana`);
    holidaysAvailable = false;
  }

  return { fechaVencimiento: addBusinessDays(fromDate, businessDays, holidayDates), holidaysAvailable };
}

export default calculateDueDate;