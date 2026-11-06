import AppError from "../../errors/AppError.js";
import { addBusinessDays, addCalendarDays } from "../../domain/businessDays.js";

/**
 * Calcula la fecha de vencimiento (regla R2): `businessDays` días hábiles a partir de `fromDate`.
 * Pide los feriados al gateway inyectado y, si la API falla, DEGRADA con elegancia: calcula solo con
 * fines de semana y lo informa (holidaysAvailable: false). Que un tercero esté caído no debe impedir prestar un libro.
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
