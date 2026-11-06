/**
 * Reloj inyectable (Clase 13).
 * La hora es un dato EXTERNO, igual que la base o una API: si un caso de uso llama a `new Date()`,
 * no se puede probar ("¿está vencido un préstamo de hace 3 semanas?" obligaría a esperar 3 semanas).
 * Por eso los casos de uso reciben un `clock` y nunca llaman a `new Date()` por su cuenta.
 *
 *  - En producción: createClock() → hora real.
 *  - Para probar a mano: CLOCK_NOW=2026-12-01T12:00:00Z ("viajar en el tiempo").
 *  - En los tests (clase 14): createClock({ fixedNow: "..." }) → siempre el mismo instante.
 */

// Zona horaria de la biblioteca: define qué día es "hoy". Una sola, fija, para todo el sistema.
const TIME_ZONE = "America/Argentina/Buenos_Aires";
// Argentina no usa horario de verano desde 2009: el desfasaje es fijo. Se usa para saber a qué instante
// corresponde el comienzo de un día "AAAA-MM-DD" (filtros desde/hasta sobre fechaPrestamo).
const UTC_OFFSET = "-03:00";

// "en-CA" formatea como AAAA-MM-DD, que es justo el formato que usamos para los días
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

function createClock({ fixedNow } = {}) {
  if (fixedNow && Number.isNaN(new Date(fixedNow).getTime())) {
    throw new Error(`CLOCK_NOW no es una fecha válida: "${fixedNow}"`);
  }
  const now = () => (fixedNow ? new Date(fixedNow) : new Date());

  return {
    now,
    // "Hoy" como AAAA-MM-DD, siempre en la zona horaria de la biblioteca
    today: () => dayFormatter.format(now()),
    // Instante en que empieza el día "AAAA-MM-DD" en la zona de la biblioteca
    startOfDay: (date) => new Date(`${date}T00:00:00${UTC_OFFSET}`),
  };
}

export { TIME_ZONE };
export default createClock;
