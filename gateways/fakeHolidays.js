import AppError from "../errors/AppError.js";

// Copia local de lo que devolvía ArgentinaDatos en noviembre de 2026 (puede quedar desactualizada: es solo para probar).
// Alcanzan para ver cómo un feriado corre el vencimiento sin depender de la red.
const FAKE_HOLIDAYS = {
  2026: [
    "2026-01-01", "2026-02-16", "2026-02-17", "2026-03-23", "2026-03-24", "2026-04-02", "2026-04-03",
    "2026-05-01", "2026-05-25", "2026-06-15", "2026-06-20", "2026-07-09", "2026-07-10", "2026-08-17",
    "2026-10-12", "2026-11-09", "2026-11-23", "2026-12-07", "2026-12-08", "2026-12-25",
  ],
  2027: [
    "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-24", "2027-03-26", "2027-04-02", "2027-05-01", "2027-05-25", "2027-06-17", "2027-06-20", "2027-07-09", "2027-08-17", "2027-10-12", "2027-11-20", "2027-12-08", "2027-12-25",
  ],
};

/**
 * Gateway de feriados FALSO: misma interfaz que el real, sin red (para clase y para tests).
 * Con `fail: true` simula que la API está caída, para probar la degradación elegante
 * (el préstamo se crea igual, contando solo fines de semana, y responde holidaysAvailable: false).
 */
function createFakeHolidays({ fail = false } = {}) {
  return {
    async getHolidays(year) {
      if (fail) {
        throw new AppError("EXTERNAL_API_ERROR", "La API de feriados respondió 500 (simulado)", 502);
      }
      return FAKE_HOLIDAYS[year] ?? [];
    },
  };
}

export default createFakeHolidays;
