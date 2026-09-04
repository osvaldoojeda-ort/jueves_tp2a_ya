// index.js
// Clase 4 — CRUD completo en memoria con Express, todo en un solo archivo
// (a propósito: en la clase 5 esto se separa en routes/ y controllers/).

const express = require("express");

const app = express();

// Línea obligatoria para que req.body exista en POST/PUT/PATCH.
// (Qué hace exactamente esto por dentro lo vemos en la clase 5.)
app.use(express.json());

// --- "Base de datos" en memoria ---
let libros = [
  { id: 1, isbn: "9780307474728", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", stock: 3 },
  { id: 2, isbn: "9780451524935", titulo: "1984", autor: "George Orwell", stock: 0 },
  { id: 3, isbn: "9780756404079", titulo: "El nombre del viento", autor: "Patrick Rothfuss", stock: 5 },
  { id: 4, isbn: "9788437604947", titulo: "Rayuela", autor: "Julio Cortázar", stock: 2 },
  { id: 5, isbn: "9781451673319", titulo: "Fahrenheit 451", autor: "Ray Bradbury", stock: 0 },
];

// --- GET /libros (con filtro opcional ?autor=) ---
app.get("/libros", (req, res) => {
  const { autor } = req.query;

  if (autor) {
    const autorBuscado = autor.toLowerCase();
    const filtrados = libros.filter((libro) =>
      libro.autor.toLowerCase().includes(autorBuscado)
    );
    return res.status(200).json(filtrados);
  }

  res.status(200).json(libros);
});

// --- GET /libros/:id ---
app.get("/libros/:id", (req, res) => {
  const id = Number(req.params.id);
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  res.status(200).json(libro);
});

// --- POST /libros ---
app.post("/libros", (req, res) => {
  const { isbn, titulo, autor, stock } = req.body;

  if (!titulo || !autor) {
    return res.status(400).json({ error: "El título y el autor son obligatorios" });
  }

  const ids = libros.map((l) => l.id);
  const nuevoId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const libroNuevo = {
    id: nuevoId,
    isbn: isbn ?? null,
    titulo,
    autor,
    stock: stock ?? 0,
  };

  libros.push(libroNuevo);
  res.status(201).json(libroNuevo);
});

// --- PUT /libros/:id ---
app.put("/libros/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = libros.findIndex((l) => l.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  // Reemplaza los campos, pero SIEMPRE mantiene el id original.
  libros[indice] = { ...req.body, id };

  res.status(200).json(libros[indice]);
});

// --- DELETE /libros/:id ---
app.delete("/libros/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = libros.findIndex((l) => l.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  libros.splice(indice, 1);
  res.status(200).json({ mensaje: "Libro eliminado correctamente" });
});

// --- Desafío opcional: PATCH /libros/:id ---
// A diferencia de PUT (que reemplaza el objeto entero), PATCH solo pisa
// los campos que vengan en el body, y deja el resto tal cual estaba.
app.patch("/libros/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = libros.findIndex((l) => l.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: "Libro no encontrado" });
  }

  libros[indice] = { ...libros[indice], ...req.body, id };

  res.status(200).json(libros[indice]);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
