// Medición (Ejercicio 4) con 5 ISBN. Fake = 300 ms por pedido; real = Open Library:
//
//   | Modo       | Pedidos HTTP | Tiempo (fake) | Tiempo (real) |
//   | sequential | 5            | ~1500 ms      | ~3000 ms      |
//   | parallel   | 5            | ~300 ms       | ~800 ms       |
//   | batch      | 1            | ~300 ms       | ~480 ms       |
//
// ¿Por qué en batch fallan TODOS los ISBN y en parallel solo uno? Porque batch es UN solo pedido: si el servidor
// responde con error, no hay respuesta para ninguno. En parallel son pedidos independientes: cada uno puede
// salir bien o mal por su cuenta. Batch es más eficiente pero todo-o-nada.

/**
 * Caso de Uso: Consultar varios ISBN en el catálogo externo, con la estrategia que se elija.
 * Existe para comparar las tres formas de hacerlo (mismo resultado, distinto tiempo):
 *   - sequential: de a uno, esperando cada respuesta (N pedidos, uno detrás del otro).
 *   - parallel:   todos a la vez con Promise.allSettled (N pedidos simultáneos).
 *   - batch:      un solo pedido con todos los ISBN (1 pedido).
 * Devuelve el resultado de cada ISBN por separado: que uno falle no tira abajo a los demás.
 */
async function lookupIsbns({ isbns, mode }, catalog) {
  const startedAt = performance.now();
  let outcomes; // [{ isbn, status: "found" | "not_found" | "failed", info?, error? }]
  let httpRequests = isbns.length;

  // Convierte lo que devolvió (o el error que lanzó) una consulta individual en un resultado uniforme
  const toOutcome = (isbn, settled) => {
    if (settled.status === "rejected") {
      return { isbn, status: "failed", error: { code: settled.reason.code ?? "ERROR", message: settled.reason.message } };
    }
    return settled.value ? { isbn, status: "found", info: settled.value } : { isbn, status: "not_found" };
  };

  if (mode === "sequential") {
    outcomes = [];
    for (const isbn of isbns) {
      // await dentro del for: cada pedido espera a que termine el anterior
      const settled = await catalog.getByIsbn(isbn).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason })
      );
      outcomes.push(toOutcome(isbn, settled));
    }
  } else if (mode === "parallel") {
    // Se lanzan todos juntos y se espera a que terminen TODOS, sea bien o mal
    const settled = await Promise.allSettled(isbns.map((isbn) => catalog.getByIsbn(isbn)));
    outcomes = settled.map((result, i) => toOutcome(isbns[i], result));
  } else {
    // batch: un único pedido. Si falla, falla para todos (no hay resultado parcial).
    httpRequests = Math.ceil(isbns.length / 20);
    try {
      const found = await catalog.getManyByIsbn(isbns);
      outcomes = isbns.map((isbn) => toOutcome(isbn, { status: "fulfilled", value: found[isbn] ?? null }));
    } catch (reason) {
      outcomes = isbns.map((isbn) => toOutcome(isbn, { status: "rejected", reason }));
    }
  }

  return {
    mode,
    requested: isbns.length,
    httpRequests,
    elapsedMs: Math.round(performance.now() - startedAt),
    results: outcomes,
  };
}

export default lookupIsbns;
