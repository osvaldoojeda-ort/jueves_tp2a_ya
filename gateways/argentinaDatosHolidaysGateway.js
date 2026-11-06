import AppError from "../errors/AppError.js";

/**
 * Gateway de feriados (Clase 13): API pública ArgentinaDatos.
 *   GET {baseUrl}/v1/feriados/2026
 *   → [{ "fecha": "2026-10-12", "tipo": "trasladable", "nombre": "Día del Respeto a la Diversidad Cultural" }, ...]
 *
 * Contrato que respetan todos los gateways de feriados (también el fake):
 *   - getHolidays(year) → ["2026-01-01", "2026-02-16", ...]   (fechas AAAA-MM-DD)
 *
 * Mismo patrón que el catálogo de la clase 12 (timeout, response.ok, JSON inválido → AppError 502/504),
 * con una diferencia: acá la caché SÍ conviene (ejercicio 4.4). Los feriados de un año casi nunca cambian, así que se piden
 * una vez por año y se guardan mientras viva el proceso. En la clase 12 la caché venía apagada porque rompía la
 * comparación de tiempos secuencial/paralelo/lote; acá no hay nada que comparar y cada préstamo pediría lo mismo.
 *
 * Decisión de NEGOCIO (no técnica): la API marca algunos días como "puente" (no laborables, optativos).
 * La biblioteca cierra esos días, así que los contamos como NO hábiles junto con los inamovibles y trasladables.
 */
function createArgentinaDatosHolidaysGateway({ baseUrl, timeoutMs }) {
  // year → Promise<string[]>. Se guarda la PROMESA: si llegan dos préstamos a la vez, comparten un solo pedido.
  const cache = new Map();

  async function fetchYear(year) {
    let response;
    try {
      response = await fetch(`${baseUrl}/v1/feriados/${year}`, {
        headers: { "User-Agent": "biblioteca-api-curso/1.0 (clase 13)" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw err.name === "TimeoutError"
        ? new AppError("EXTERNAL_TIMEOUT", "La API de feriados tardó demasiado en responder", 504)
        : new AppError("EXTERNAL_API_ERROR", "No se pudo conectar con la API de feriados", 502);
    }

    if (!response.ok) {
      throw new AppError("EXTERNAL_API_ERROR", `La API de feriados respondió ${response.status}`, 502);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new AppError("EXTERNAL_API_ERROR", "La API de feriados devolvió una respuesta inválida", 502);
    }
    if (!Array.isArray(data)) {
      throw new AppError("EXTERNAL_API_ERROR", "La API de feriados devolvió un formato inesperado", 502);
    }

    // Capa anticorrupción: del modelo externo solo nos quedamos con la fecha
    return data.map((h) => h.fecha).filter((fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha));
  }

  return {
    async getHolidays(year) {
      if (!cache.has(year)) {
        const pending = fetchYear(year);
        cache.set(year, pending);
        // Una falla NO se guarda en caché: el próximo préstamo vuelve a intentar
        pending.catch(() => cache.delete(year));
      }
      return cache.get(year);
    },
  };
}

export default createArgentinaDatosHolidaysGateway;
