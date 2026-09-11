// Ejercicio 3 — Secuencial vs paralelo

const obtenerLibroPorIsbn = require("./openLibrary.js");

const isbns = [
  "9780307474728",
  "9780345391803",
  "9780140449136",
  "9780061120084",
  "9780393312838",
];

// 1) Secuencial: un await adentro de un for...of. Cada búsqueda espera a que
// termine la anterior antes de arrancar.
async function buscarSecuencial(listaIsbns) {
  console.time("secuencial");
  const resultados = [];
  for (const isbn of listaIsbns) {
    try {
      const libro = await obtenerLibroPorIsbn(isbn);
      resultados.push(libro);
    } catch (error) {
      resultados.push({ isbn, error: error.message });
    }
  }
  console.timeEnd("secuencial");
  return resultados;
}

// 2) Paralelo: todas las búsquedas se disparan casi al mismo tiempo con
// Promise.all. Se atrapa el error de cada promesa individualmente con
// .catch() para que, si un ISBN falla, no tire abajo a los demás resultados
// (Promise.all rechaza todo apenas UNA promesa rechaza).
async function buscarParalelo(listaIsbns) {
  console.time("paralelo");
  const promesas = listaIsbns.map((isbn) =>
    obtenerLibroPorIsbn(isbn).catch((error) => ({ isbn, error: error.message }))
  );
  const resultados = await Promise.all(promesas);
  console.timeEnd("paralelo");
  return resultados;
}

async function main() {
  console.log("--- Secuencial ---");
  const resultadosSecuencial = await buscarSecuencial(isbns);
  console.log(resultadosSecuencial);

  console.log("\n--- Paralelo ---");
  const resultadosParalelo = await buscarParalelo(isbns);
  console.log(resultadosParalelo);
}

main();

// CONCLUSIÓN:
//
// El modo paralelo (Promise.all) termina mucho más rápido que el secuencial
// cuando las operaciones son independientes entre sí: en el secuencial, cada
// await bloquea el ciclo hasta que esa request en particular termina antes de
// arrancar la siguiente, así que el tiempo total es aproximadamente la SUMA
// de los tiempos de las 5 requests. En el paralelo, las 5 requests salen casi
// al mismo tiempo y el tiempo total es aproximadamente el de la request MÁS
// LENTA de todas (no la suma).
//
// ¿En qué caso NO conviene usar Promise.all?
// - Cuando una operación depende del resultado de la anterior (por ejemplo,
//   necesito el id que devuelve la primera petición para poder hacer la
//   segunda): ahí no hay forma de paralelizar, tiene que ser secuencial sí o sí.
// - Cuando la API tiene rate limiting (límite de requests por segundo/minuto):
//   mandar todo junto puede hacer que nos bloqueen o nos devuelvan error 429.
// - Cuando el orden de ejecución importa por algún efecto secundario (por
//   ejemplo, escribir logs o registros en un orden específico).
// - Cuando se necesita controlar cuántas requests van "a la vez" para no
//   saturar la base de datos o el servidor de destino (ahí se usa algo
//   intermedio, como procesar de a lotes, en vez de secuencial puro o
//   Promise.all puro).
