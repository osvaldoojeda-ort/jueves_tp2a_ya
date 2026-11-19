import { CATALOG_TYPE, OPEN_LIBRARY_URL, EXTERNAL_TIMEOUT_MS, FAKE_LATENCY_MS } from "../config/config.js";
import createOpenLibraryGateway from "./openLibraryGateway.js";
import createFakeCatalog from "./fakeCatalog.js";

/**
 * Factory de catálogos (igual que daoFactory y notifierFactory).
 * Según CATALOG_TYPE devuelve la API real de Open Library o un catálogo falso que no usa la red.
 * Los dos cumplen el mismo contrato: getByIsbn(isbn) y getManyByIsbn(isbns).
 */
function getCatalog() {
  if (CATALOG_TYPE === "fake") {
    console.log(`[Catálogo] Usando catálogo FALSO (demora simulada: ${FAKE_LATENCY_MS} ms por pedido)`);
    return createFakeCatalog({ latencyMs: FAKE_LATENCY_MS });
  }
  console.log(`[Catálogo] Usando Open Library (${OPEN_LIBRARY_URL})`);
  return createOpenLibraryGateway({ baseUrl: OPEN_LIBRARY_URL, timeoutMs: EXTERNAL_TIMEOUT_MS });
}

export { getCatalog };