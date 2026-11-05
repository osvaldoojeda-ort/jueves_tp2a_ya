import {
  CATALOG_TYPE,
  OPEN_LIBRARY_URL,
  EXTERNAL_TIMEOUT_MS,
  CATALOG_CACHE_TTL_MS,
  EXTERNAL_RETRIES,
  EXTERNAL_RETRY_BASE_MS,
  FAKE_LATENCY_MS,
} from "../config/config.js";
import createOpenLibraryGateway from "./openLibraryGateway.js";
import createFakeCatalog from "./fakeCatalog.js";

/**
 * Factory de catálogos (equivalente a daoFactory y notifierFactory).
 * Devuelve el catálogo según CATALOG_TYPE: la API real de Open Library o una versión falsa sin red.
 */
function getCatalog() {
  if (CATALOG_TYPE === "fake") {
    console.log(`[Catálogo] Usando catálogo FALSO (demora simulada: ${FAKE_LATENCY_MS} ms por pedido)`);
    return createFakeCatalog({ latencyMs: FAKE_LATENCY_MS });
  }
  console.log(`[Catálogo] Usando Open Library (${OPEN_LIBRARY_URL})`);
  return createOpenLibraryGateway({
    baseUrl: OPEN_LIBRARY_URL,
    timeoutMs: EXTERNAL_TIMEOUT_MS,
    cacheTtlMs: CATALOG_CACHE_TTL_MS,
    retries: EXTERNAL_RETRIES,
    retryBaseMs: EXTERNAL_RETRY_BASE_MS,
  });
}

export { getCatalog };
