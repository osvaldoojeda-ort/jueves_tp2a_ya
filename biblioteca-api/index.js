// index.js
//
// Como ahora TODAS las funciones de libroService.js son async, hay que llamarlas
// con `await` dentro de una función async (o encadenarlas con .then). Este
// archivo prueba el flujo completo: listar, agregar uno nuevo, y listar de
// nuevo para confirmar que quedó guardado en el archivo.

const {
  listarLibros,
  buscarPorId,
  buscarPorAutor,
  contarConStock,
  agregarLibro,
} = require("./libroService");

async function main() {
  console.log("--- Listado inicial ---");
  console.log(await listarLibros());

  console.log("\n--- Buscar por id 2 ---");
  console.log(await buscarPorId(2));

  console.log("\n--- Buscar por autor 'cortázar' ---");
  console.log(await buscarPorAutor("cortázar"));

  console.log("\n--- Contar libros con stock > 0 ---");
  console.log(await contarConStock());

  console.log("\n--- Agregar un libro nuevo ---");
  const nuevo = await agregarLibro({
    titulo: "Ficciones",
    autor: "Jorge Luis Borges",
    anio: 1944,
    stock: 4,
  });
  console.log("Libro creado:", nuevo);

  console.log("\n--- Listado después de agregar ---");
  console.log(await listarLibros());
  console.log(
    "\n(Si corren este archivo de nuevo, van a ver OTRO 'Ficciones' agregado: " +
      "es la prueba de que ahora persiste en data/libros.json, no solo en memoria.)"
  );
  
}

main();
