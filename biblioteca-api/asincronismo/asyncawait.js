// Ejercicio 1 (forma 3) — async/await, envolviendo la misma Promise del punto 2.
// Es la forma más fácil de leer: el flujo se ve "de arriba hacia abajo",
// como código síncrono, sin anidar .then() ni callbacks dentro de callbacks.

const buscarLibroPorId = require("./promesa.js");

async function main() {
  console.log("Buscando libro con id 1...");
  try {
    const libro = await buscarLibroPorId(1);
    console.log("Libro encontrado:", libro);
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log("Buscando libro con id 999 (no existe)...");
  try {
    const libro = await buscarLibroPorId(999);
    console.log("Libro encontrado:", libro);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();

// Comparación de las 3 formas (callback.js, promesa.js, asyncawait.js):
// - callback.js: funciona, pero si tuviéramos que encadenar varias búsquedas
//   dependientes entre sí, terminaríamos con "callback hell" (callbacks
//   anidados dentro de callbacks).
// - promesa.js: ya se puede encadenar con .then()/.catch() sin anidar tanto,
//   pero para varios pasos seguidos igual se vuelve una cadena larga de .then().
// - asyncawait.js: es la más fácil de leer porque el código async se parece
//   a código síncrono normal, y los errores se manejan con try/catch, igual
//   que en código sync. Por debajo sigue usando Promises (de hecho, reutiliza
//   la misma función de promesa.js).
