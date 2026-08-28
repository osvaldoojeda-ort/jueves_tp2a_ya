// Ejercicio 0 — Predecir el Event Loop
//
// MI PREDICCIÓN (escrita ANTES de correr el código):
// 1. A   -> primera línea síncrona, se ejecuta apenas arranca el script.
// 2. D   -> saludar() se invoca de forma síncrona (la llamada está antes del
//           console.log("F")). Todo lo que hay ANTES del primer await dentro
//           de una función async corre de forma síncrona, como cualquier otra
//           línea de código: por eso "D" se imprime ACÁ, no después de "F".
// 3. F   -> es la última línea síncrona del script. Recién cuando termina de
//           correr todo el código síncrono (incluida la parte de saludar()
//           previa a su await) el event loop pasa a las microtasks.
// 4. C   -> es la microtask del .then() de Promise.resolve(), que quedó
//           encolada ANTES que la continuación de saludar() (el .then() se
//           registró en la línea 3 del archivo, y saludar() recién llega a
//           su await más adelante).
// 5. E   -> es la continuación de saludar() después de "await null". También
//           es una microtask, pero se encoló después que la de C, así que sale
//           después.
// 6. B   -> setTimeout(..., 0) encola una macrotask (timer). Las macrotasks
//           se ejecutan recién cuando se vació POR COMPLETO la cola de
//           microtasks, así que aunque su delay sea 0ms, siempre sale último.
//
// Orden esperado: A, D, F, C, E, B

console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

async function saludar() {
  console.log("D");
  await null;
  console.log("E");
}
saludar();

console.log("F");

// ANOTAR ACÁ (después de correrlo):
//
// Resultado real obtenido: A, D, F, C, E, B  -> coincide con la predicción.
//
// (La primera vez que pensé este ejercicio "a ojo" me salió A, F, D, C, E, B,
// es decir, puse F antes que D. Ese es justamente el error más común de este
// ejercicio: uno tiende a pensar "async function = asíncrona desde el
// principio", pero NO es así. Una función async es 100% síncrona hasta que
// se topa con el primer await; recién ahí "se pausa" y le devuelve el control
// al código que sigue. Como saludar() se llama ANTES del console.log("F"),
// todo lo que hay antes del await (o sea, "D") se imprime antes que "F".)
//
// Por qué el resto del orden es como es:
// - "await null" es equivalente, en términos de orden de ejecución, a hacer
//   Promise.resolve(null).then(() => continuar). Por eso la continuación (E)
//   no es instantánea: se encola en la misma cola de microtasks que un .then()
//   común, no corta la ejecución del resto del script síncrono.
// - El .then() que imprime C se registró en el código ANTES de que saludar()
//   llegara a su await, así que la microtask de C queda adelante en la cola
//   respecto de la de E. Por eso C sale antes que E.
// - El event loop vacía SIEMPRE toda la cola de microtasks (Promises, await)
//   antes de pasar a la siguiente macrotask (timers, I/O). Por eso B, que es
//   un setTimeout, es indefectiblemente lo último en imprimirse, aunque su
//   delay sea 0.
