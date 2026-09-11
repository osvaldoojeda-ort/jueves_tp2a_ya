// Ejercicio 1 (forma 1) — callback tradicional estilo Node ("error-first callback")
//
// buscarLibroPorId(id, callback) simula una consulta a una base de datos:
// espera 500ms y después llama a callback(error, libro).

const libros = require("../data/libros.js");

function buscarLibroPorId(id, callback) {
  setTimeout(() => {
    const libro = libros.find((l) => l.id === id);
    if (!libro) {
      callback(new Error(`No se encontró ningún libro con id ${id}`));
      return;
    }
    callback(null, libro);
  }, 500);
}

// --- Prueba (solo corre si ejecutamos este archivo directamente) ---
if (require.main === module) {
  console.log("Buscando libro con id 2...");
  buscarLibroPorId(2, (error, libro) => {
    if (error) {
      console.error("Error:", error.message);
      return;
    }
    console.log("Libro encontrado:", libro);
  });

  console.log("Buscando libro con id 999 (no existe)...");
  buscarLibroPorId(999, (error, libro) => {
    if (error) {
      console.error("Error:", error.message);
      return;
    }
    console.log("Libro encontrado:", libro);
  });
}

module.exports = buscarLibroPorId;
