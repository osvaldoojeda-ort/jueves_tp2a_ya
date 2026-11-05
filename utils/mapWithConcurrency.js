/**
 * Ejecuta `fn` sobre cada elemento con como máximo `limit` ejecuciones SIMULTÁNEAS.
 * Es un punto medio entre el for/await (de a uno, lento) y el Promise.all (todo junto, puede saturar a la API externa).
 * Devuelve un arreglo con la misma forma que Promise.allSettled: { status, value | reason }, en el mismo orden.
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;

  // Cada "worker" toma el siguiente elemento pendiente apenas termina el anterior
  async function worker() {
    while (next < items.length) {
      const index = next++; // sin await entre leer y sumar: no hay carrera en un solo hilo
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index], index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export default mapWithConcurrency;
