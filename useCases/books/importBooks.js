import mapWithConcurrency from "../../utils/mapWithConcurrency.js";

// Reflexión (Ejercicio 9.4): ¿qué cambiaría si llegaran 500 ISBN en lugar de 10?
//  1. El pedido HTTP tardaría minutos (500 consultas con 3 simultáneas ≈ 170 rondas): el cliente o un proxy
//     cortaría por timeout. Habría que hacerlo ASÍNCRONO: responder 202 Accepted con un id de trabajo,
//     procesar en segundo plano (cola/worker) y exponer GET /books/import/:jobId con el progreso.
//  2. Consultaría en LOTE (getManyByIsbn, 20 ISBN por pedido ≈ 25 pedidos) en vez de uno por ISBN: 20 veces menos
//     pedidos, y menos probabilidad de que Open Library nos limite o bloquee.
//  3. Guardaría en bloques con una transacción (bulkCreate) en vez de 500 inserts sueltos.
//  4. Pondría un tope por pedido y un rate limit por usuario, y reintentos con backoff para las fallas transitorias.
//  5. El informe se guardaría (no cabe en una respuesta) y se iría armando a medida que avanza el trabajo.

/**
 * Caso de Uso: Importar libros desde el catálogo externo a partir de una lista de ISBN.
 * - Consulta el catálogo en paralelo pero con tope de simultáneos (no se satura la API externa).
 * - Cada ISBN tiene su propio resultado: uno que falla no cancela a los demás (como Promise.allSettled).
 * - Los libros se guardan con createBook, así que se aplican las mismas reglas que al crear uno a mano
 *   (ISBN duplicado, alerta de stock bajo...).
 * Devuelve un informe: { imported, skipped, notFound, failed }.
 */
async function importBooks({ isbns, stock }, dao, catalog, createBook, concurrency) {
  const unique = [...new Set(isbns)]; // si repiten un ISBN en la lista, se consulta una sola vez

  const lookups = await mapWithConcurrency(unique, concurrency, async (isbn) => {
    if (await dao.getByIsbn(isbn)) return { isbn, status: "skipped" }; // ya lo tenemos
    const info = await catalog.getByIsbn(isbn);
    return info ? { isbn, status: "found", info } : { isbn, status: "notFound" };
  });

  const report = { imported: [], skipped: [], notFound: [], failed: [] };

  // Las escrituras van de a una: son rápidas y así los eventos y los ids quedan en orden
  for (const [i, lookup] of lookups.entries()) {
    const isbn = unique[i];
    if (lookup.status === "rejected") {
      report.failed.push({ isbn, code: lookup.reason.code ?? "ERROR", message: lookup.reason.message });
    } else if (lookup.value.status === "skipped") {
      report.skipped.push({ isbn, reason: "ISBN_DUPLICATE" });
    } else if (lookup.value.status === "notFound") {
      report.notFound.push({ isbn });
    } else {
      const { info } = lookup.value;
      const book = await createBook({
        titulo: info.titulo ?? `Libro ${isbn}`,
        autor: info.autores.join(", ") || "Autor desconocido",
        isbn,
        stock,
      });
      report.imported.push(book);
    }
  }

  return report;
}

export default importBooks;
