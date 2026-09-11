// libroService.js
//
// Antes (clase 1) este archivo hacía `const libros = require("./data/libros");`
// y trabajaba siempre sobre ese array en memoria: cualquier cambio se perdía
// al reiniciar el proceso.
//
// Desde la clase 3, en vez de eso leemos y escribimos en data/libros.json con
// fs/promises. Por eso TODAS las funciones pasan a ser `async`: incluso
// listarLibros(), que antes devolvía el array directo, ahora tiene que hacer
// un `await fs.readFile(...)` por dentro, y esa espera se propaga a todas las
// funciones que dependen de ella.

const fs = require("fs/promises");
const path = require("path");

console.log(path);

// const RUTA_LIBROS = path.join(__dirname, "data", "libros.json");
const RUTA_LIBROS = path.join(__dirname, "data", "libros.json");

console.log(__dirname);

async function listarLibros() {
  const contenido = await fs.readFile(RUTA_LIBROS, "utf-8");
  return JSON.parse(contenido);
}

async function buscarPorId(id) {
  const libros = await listarLibros();
  return libros.find((libro) => libro.id === id);
}

async function buscarPorAutor(autor) {
  const libros = await listarLibros();
  const autorBuscado = autor.toLowerCase();
  const encontrado = libros.filter((libro) => libro.autor.toLowerCase().includes(autorBuscado));
  if (encontrado.length > 0) {
    return encontrado;
  } else {
    throw new Error(`No se encontró ningún libro del autor "${autor}"`);
  }
}

async function contarConStock() {
  const libros = await listarLibros();
  return libros.filter((libro) => libro.stock > 0).length;
}

// Nueva en la clase 3: agrega un libro y lo persiste en el archivo.
async function agregarLibro(libro) {
  const libros = await listarLibros();

  const ids = libros.map((l) => l.id);
  const nuevoId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const libroNuevo = { id: nuevoId, ...libro };
  libros.push(libroNuevo);

  await fs.writeFile(RUTA_LIBROS, JSON.stringify(libros, null, 2));

  return libroNuevo;
}

module.exports = {
  listarLibros,
  buscarPorId,
  buscarPorAutor,
  contarConStock,
  agregarLibro,
};
