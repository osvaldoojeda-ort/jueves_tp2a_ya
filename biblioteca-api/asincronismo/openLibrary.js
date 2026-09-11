// Ejercicio 2 — Consumir la API pública de Open Library
// https://openlibrary.org/dev/docs/api/books
//
// Requiere Node 18+ (usa el `fetch` global, sin instalar nada extra).

async function obtenerLibroPorIsbn(isbn) {
  const url = `https://openlibrary.org/isbn/${isbn}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `No se encontró ningún libro con ISBN ${isbn} (status ${response.status})`
    );
  }

  const data = await response.json();

  return {
    titulo: data.title,
    cantidadPaginas: data.number_of_pages,
  };
}

// --- Prueba (solo corre si ejecutamos este archivo directamente) ---
async function main() {
  // ISBN real
  try {
    const libro = await obtenerLibroPorIsbn("9780307474728");
    console.log("Libro encontrado:", libro);
  } catch (error) {
    console.error("Error:", error.message);
  }

  // ISBN inventado, no existe en Open Library
  try {
    const libro = await obtenerLibroPorIsbn("0000000000000");
    console.log("Libro encontrado:", libro);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = obtenerLibroPorIsbn;
