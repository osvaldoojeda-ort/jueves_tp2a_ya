import AppError from "../errors/AppError.js";

// Cuántos ISBN se piden por cada request al consultar en lote (evita URLs gigantes)
const BATCH_SIZE = 20;

// Preguntas de la consigna (Ejercicio 1):
//  - ¿Qué devuelve la API con un ISBN que no existe? NO devuelve un 404: responde 200 con un objeto vacío {}.
//    Por eso "no encontrado" se detecta mirando si la clave "ISBN:..." falta en la respuesta.
//  - ¿Y con dos ISBN en el mismo pedido? Con bibkeys=ISBN:a,ISBN:b responde un solo objeto con una clave por cada ISBN
//    que conoce (los desconocidos faltan). Es lo que permite consultar en lote con un único pedido.
//
// Ejercicio 2.7: ¿por qué fetch necesita un `if (!response.ok)` aparte del try/catch?
//    Porque fetch solo rechaza la promesa ante errores de RED (sin conexión, DNS, timeout). Si el servidor contesta
//    un 404 o un 500, la promesa se resuelve con normalidad y el try/catch no se entera: hay que mirar el status.

/**
 * Gateway (adaptador) de la API pública de Open Library.
 * Contrato que respetan todos los catálogos (también el fake):
 *   - getByIsbn(isbn)        → info | null          (1 request HTTP)
 *   - getManyByIsbn(isbns)   → { [isbn]: info }     (1 request cada BATCH_SIZE ISBN)
 *
 * También es una "capa anticorrupción": traduce el modelo de la API externa (title, authors[{name}],
 * number_of_pages...) a NUESTRO modelo (titulo, autores, paginas...). Lo de afuera no se filtra hacia adentro.
 */
function createOpenLibraryGateway({ baseUrl, timeoutMs, cacheTtlMs = 0, retries = 0, retryBaseMs = 1000 }) {
  // Caché en memoria con vencimiento: isbn → { info, expiresAt }. Guarda también los "no encontrado" (info = null).
  // Es por proceso: si hay varias instancias del servidor, cada una tiene la suya (para compartirla se usa Redis).
  const cache = new Map();
  const readCache = (isbn) => {
    const hit = cache.get(isbn);
    if (!hit) return undefined; // undefined = no está en caché (distinto de null = "se sabe que no existe")
    if (hit.expiresAt < Date.now()) {
      cache.delete(isbn);
      return undefined;
    }
    return hit.info;
  };
  const writeCache = (isbn, info) => {
    if (cacheTtlMs > 0) cache.set(isbn, { info, expiresAt: Date.now() + cacheTtlMs });
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Modelo externo → modelo propio
  function toBookInfo(isbn, data) {
    return {
      isbn,
      titulo: data.title ?? null,
      autores: (data.authors ?? []).map((a) => a.name),
      editorial: data.publishers?.[0]?.name ?? null,
      fechaPublicacion: data.publish_date ?? null,
      paginas: data.number_of_pages ?? null,
      portada: data.cover?.medium ?? null,
      url: data.url ?? null,
    };
  }

  // Un único pedido HTTP: devuelve { "ISBN:...": {...} } con solo los ISBN que la API conoce
  async function fetchOnce(isbns) {
    const bibkeys = isbns.map((isbn) => `ISBN:${isbn}`).join(",");
    const url = `${baseUrl}/api/books?bibkeys=${bibkeys}&format=json&jscmd=data`;

    let response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "biblioteca-api-curso/1.0 (clase 12)" },
        // Sin timeout, un servidor externo colgado deja colgado también a nuestro request
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // fetch solo rechaza ante errores de RED (sin conexión, DNS, timeout), NO ante un 404 o un 500
      // Las fallas de red y los timeouts suelen ser transitorios: se pueden reintentar
      const error =
        err.name === "TimeoutError"
          ? new AppError("EXTERNAL_TIMEOUT", "El catálogo externo tardó demasiado en responder", 504)
          : new AppError("EXTERNAL_API_ERROR", "No se pudo conectar con el catálogo externo", 502);
      error.retryable = true;
      throw error;
    }

    // Un 4xx/5xx NO lanza error en fetch: hay que mirar response.ok a mano
    if (!response.ok) {
      const error = new AppError("EXTERNAL_API_ERROR", `El catálogo externo respondió ${response.status}`, 502);
      // Solo vale la pena reintentar una falla del SERVIDOR (5xx). Un 4xx (ej. 404, 400) es culpa nuestra
      // y va a dar el mismo error cada vez: reintentar solo gastaría tiempo y pedidos.
      error.retryable = response.status >= 500;
      throw error;
    }

    try {
      return await response.json();
    } catch {
      throw new AppError("EXTERNAL_API_ERROR", "El catálogo externo devolvió una respuesta inválida", 502);
    }
  }

  // Reintentos con espera creciente (backoff exponencial): 1 s, 2 s, 4 s... (retryBaseMs × 2^intento)
  // Esperar cada vez más evita martillar a un servidor que ya está con problemas.
  async function fetchData(isbns) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fetchOnce(isbns);
      } catch (err) {
        if (!err.retryable || attempt >= retries) throw err;
        await sleep(retryBaseMs * 2 ** attempt);
      }
    }
  }

  return {
    async getByIsbn(isbn) {
      const cached = readCache(isbn);
      if (cached !== undefined) return cached;

      const data = await fetchData([isbn]);
      const info = data[`ISBN:${isbn}`] ? toBookInfo(isbn, data[`ISBN:${isbn}`]) : null;
      writeCache(isbn, info);
      return info;
    },

    async getManyByIsbn(isbns) {
      const result = {};
      const missing = [];
      for (const isbn of isbns) {
        const cached = readCache(isbn);
        if (cached === undefined) missing.push(isbn);
        else if (cached) result[isbn] = cached;
      }
      if (missing.length === 0) return result; // todo estaba en caché: cero pedidos

      const chunks = [];
      for (let i = 0; i < missing.length; i += BATCH_SIZE) chunks.push(missing.slice(i, i + BATCH_SIZE));

      // Los lotes son independientes entre sí: se piden en paralelo
      const responses = await Promise.all(chunks.map((chunk) => fetchData(chunk)));

      for (const data of responses) {
        for (const [key, value] of Object.entries(data)) {
          const isbn = key.replace("ISBN:", "");
          result[isbn] = toBookInfo(isbn, value);
        }
      }
      for (const isbn of missing) writeCache(isbn, result[isbn] ?? null);
      return result;
    },
  };
}

export default createOpenLibraryGateway;
