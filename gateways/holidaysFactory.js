import { HOLIDAYS_TYPE, HOLIDAYS_URL, EXTERNAL_TIMEOUT_MS } from "../config/config.js";
import createArgentinaDatosHolidaysGateway from "./argentinaDatosHolidaysGateway.js";
import createFakeHolidays from "./fakeHolidays.js";

/**
 * Factory de gateways de feriados (equivalente a catalogFactory).
 *   - "argentinadatos": API real
 *   - "fake":           datos locales, sin red
 *   - "fake-down":      simula que la API está caída (para probar la degradación elegante)
 */
function getHolidaysGateway() {
  if (HOLIDAYS_TYPE === "fake" || HOLIDAYS_TYPE === "fake-down") {
    const fail = HOLIDAYS_TYPE === "fake-down";
    console.log(`[Feriados] Usando feriados FALSOS${fail ? " (simulando API caída)" : ""}`);
    return createFakeHolidays({ fail });
  }
  console.log(`[Feriados] Usando ArgentinaDatos (${HOLIDAYS_URL})`);
  return createArgentinaDatosHolidaysGateway({ baseUrl: HOLIDAYS_URL, timeoutMs: EXTERNAL_TIMEOUT_MS });
}

export { getHolidaysGateway };
