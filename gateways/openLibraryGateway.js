import AppError from "../errors/AppError.js";

/*
 * Ej. 1.2 — Lo que se ve consultando la API a mano:
 *  - ¿Qué devuelve con un ISBN que no existe? NO responde 404: responde 200 con un objeto vacío {}.
 *    Por eso "no encontrado" se detecta viendo que falta la clave "ISBN:..." en la respuesta.
 *  - ¿Y con dos ISBN en el mismo pedido (ISBN:a,ISBN:b)? Responde UN objeto con una clave por cada ISBN
 *    que conoce (los desconocidos no aparecen). Eso es lo que permite consultar en lote con un solo pedido.
 *
 * Ej. 2.7 — ¿Por qué fetch necesita un `if (!response.ok)` aparte del try/catch?
 *  Porque fetch solo rechaza la promesa ante errores de RED (sin conexión, DNS, timeout). Si el servidor
 *  contesta un 404 o un 500, la promesa se resuelve normalmente y el catch no se entera: hay que mirar el status.
 */

// Cuántos ISBN se piden por request al consultar en lote (evita URLs gigantes)
const BATCH_SIZE = 20;

/**
 * Gateway (adaptador) de la API pública de Open Library.
 * Contrato que cumplen todos los catálogos (también el fake):
 *   - getByIsbn(isbn)       → info | null         (1 pedido HTTP)
 *   - getManyByIsbn(isbns)  → { [isbn]: info }    (1 pedido cada BATCH_SIZE ISBN)
 * Además traduce el modelo de afuera (title, authors[{name}]...) al nuestro (titulo, autores...):
 * lo de la API externa no se filtra hacia adentro de la aplicación.
 */
function createOpenLibraryGateway({ baseUrl, timeoutMs }) {
  // Modelo externo → modelo propio. Con ?. y ?? porque la API puede omitir cualquier campo.
  function toBookInfo(isbn, data) {
    return {
      isbn,
      titulo: data.title ?? null,
      autores: (data.authors ?? []).map((a) => a.name),
      editorial: data.publishers?.[0]?.name ?? null,
      fechaPublicacion: data.publish_date ?? null,
      paginas: data.number_of_pages ?? null,
    };
  }

  // Un único pedido HTTP: devuelve { "ISBN:...": {...} } solo con los ISBN que la API conoce
  async function fetchData(isbns) {
    const bibkeys = isbns.map((isbn) => `ISBN:${isbn}`).join(",");
    const url = `${baseUrl}/api/books?bibkeys=${bibkeys}&format=json&jscmd=data`;

    let response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "biblioteca-api-ricardo/1.0 (ORT TP-2, clase 12)" },
        // Sin timeout, un servidor externo colgado deja colgado también nuestro request
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err.name === "TimeoutError") {
        throw new AppError("EXTERNAL_TIMEOUT", "El catálogo externo tardó demasiado en responder", 504);
      }
      throw new AppError("EXTERNAL_API_ERROR", "No se pudo conectar con el catálogo externo", 502);
    }

    // Un 4xx o 5xx NO hace fallar a fetch: hay que revisarlo a mano
    if (!response.ok) {
      throw new AppError("EXTERNAL_API_ERROR", `El catálogo externo respondió ${response.status}`, 502);
    }

    try {
      return await response.json();
    } catch {
      throw new AppError("EXTERNAL_API_ERROR", "El catálogo externo devolvió una respuesta inválida", 502);
    }
  }

  return {
    async getByIsbn(isbn) {
      const data = await fetchData([isbn]);
      const raw = data[`ISBN:${isbn}`];
      return raw ? toBookInfo(isbn, raw) : null;
    },

    async getManyByIsbn(isbns) {
      // Se parte la lista en lotes de BATCH_SIZE; los lotes son independientes y se piden en paralelo
      const chunks = [];
      for (let i = 0; i < isbns.length; i += BATCH_SIZE) chunks.push(isbns.slice(i, i + BATCH_SIZE));
      const responses = await Promise.all(chunks.map((chunk) => fetchData(chunk)));

      const result = {};
      for (const data of responses) {
        for (const [key, raw] of Object.entries(data)) {
          const isbn = key.replace("ISBN:", "");
          result[isbn] = toBookInfo(isbn, raw);
        }
      }
      return result;
    },
  };
}

export default createOpenLibraryGateway;