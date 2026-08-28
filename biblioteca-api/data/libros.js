// data/libros.js
// "Base de datos" en memoria de la biblioteca (clase 1).
// Cada libro tiene un id interno propio de esta API.
// (Los ISBN reales que se usan en los ejercicios 2 y 3 son de libros distintos,
// consultados contra Open Library, no contra este array.)

const libros = [
  { id: 1, titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967 },
  { id: 2, titulo: "1984", autor: "George Orwell", anio: 1949 },
  { id: 3, titulo: "El nombre del viento", autor: "Patrick Rothfuss", anio: 2007 },
  { id: 4, titulo: "Rayuela", autor: "Julio Cortázar", anio: 1963 },
  { id: 5, titulo: "Fahrenheit 451", autor: "Ray Bradbury", anio: 1953 },
];

module.exports = libros;
