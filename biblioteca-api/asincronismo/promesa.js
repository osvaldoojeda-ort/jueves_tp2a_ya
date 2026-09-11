// Ejercicio 1 (forma 2) — la misma función, ahora devolviendo una Promise
// en vez de recibir un callback.

const libros = require("../data/libros.js");

function buscarLibroPorId(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const libro = libros.find((l) => l.id === id);
      if (!libro) {
        reject(new Error(`No se encontró ningún libro con id ${id}`));
        return;
      }
      resolve(libro);
    }, 500);
  });
}

// --- Prueba (solo corre si ejecutamos este archivo directamente) ---
if (require.main === module) {
  console.log("Buscando libro con id 3...");
  buscarLibroPorId(3)
    .then((libro) => console.log("Libro encontrado:", libro))
    .catch((error) => console.error("Error:", error.message));

  console.log("Buscando libro con id 999 (no existe)...");
  buscarLibroPorId(999)
    .then((libro) => console.log("Libro encontrado:", libro))
    .catch((error) => console.error("Error:", error.message));
}

module.exports = buscarLibroPorId;
