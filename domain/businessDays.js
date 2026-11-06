/**
 * Calendario de días hábiles (Clase 13, regla R2).
 * Funciones PURAS: reciben datos y devuelven un resultado, sin leer la base, ni la hora, ni la red.
 * Por eso se entienden y se testean sin infraestructura (clase 14).
 *
 * Las fechas son texto "AAAA-MM-DD" (días, no instantes): así no hay problemas de zona horaria.
 * Internamente se usa UTC solo como "calendario neutro" para sumar días.
 */

const toIso = (date) => date.toISOString().slice(0, 10);

// ¿Es hábil? No es sábado (6), ni domingo (0), ni feriado
function isBusinessDay(isoDate, holidaySet) {
  const dayOfWeek = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(isoDate);
}

// Suma `days` días hábiles a partir de `startDate` (el día de inicio no cuenta)
function addBusinessDays(startDate, days, holidays = []) {
  const holidaySet = new Set(holidays); // búsqueda rápida
  const date = new Date(`${startDate}T00:00:00Z`);
  let remaining = days;

  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1); // avanzamos un día
    if (isBusinessDay(toIso(date), holidaySet)) {
      remaining--; // solo cuenta si es hábil
    }
  }
  return toIso(date);
}

// Suma días CORRIDOS (sirve, por ejemplo, para saber qué años de feriados hay que pedir)
function addCalendarDays(startDate, days) {
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

// Diferencia en días corridos entre dos fechas AAAA-MM-DD (to - from)
function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export { addBusinessDays, addCalendarDays, daysBetween, isBusinessDay };
