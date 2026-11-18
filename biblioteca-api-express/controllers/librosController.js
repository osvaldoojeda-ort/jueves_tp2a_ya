const libros = require("../data/libros");

function listar(req, res) {
  let resultado = [...libros];

  // Filtro por autor (de la clase 4)
  if (req.query.autor) {
    const autorBuscado = req.query.autor.toLowerCase();
    resultado = resultado.filter((libro) =>
      libro.autor.toLowerCase().includes(autorBuscado)
    );
  }

  // Orden: ?sort=titulo (asc) o ?sort=-stock (desc)
  if (req.query.sort) {
    const campo = req.query.sort.startsWith("-")
      ? req.query.sort.slice(1)
      : req.query.sort;
    const direccion = req.query.sort.startsWith("-") ? -1 : 1;

    resultado = resultado.sort((a, b) => {
      if (a[campo] < b[campo]) return -1 * direccion;
      if (a[campo] > b[campo]) return 1 * direccion;
      return 0;
    });
  }

  // Paginación
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const total = resultado.length;
  const inicio = (page - 1) * limit;
  const fin = inicio + limit;
  const paginado = resultado.slice(inicio, fin);

  res.json({ page, limit, total, data: paginado });
}

function obtener(req, res) {
  const id = Number(req.params.id);
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    return res.status(404).json({
      error: { code: "LIBRO_NO_ENCONTRADO", message: `No existe un libro con id ${id}` },
    });
  }

  res.json(libro);
}

function crear(req, res) {
  const { titulo, autor, isbn, stock } = req.body;

  if (!titulo || !autor) {
    return res.status(400).json({
      error: { code: "DATOS_INCOMPLETOS", message: "Faltan campos obligatorios: titulo y autor" },
    });
  }

  const nuevoId = libros.length > 0 ? Math.max(...libros.map((l) => l.id)) + 1 : 1;

  const nuevoLibro = {
    id: nuevoId,
    isbn: isbn || "",
    titulo,
    autor,
    stock: Number(stock) || 0,
  };

  libros.push(nuevoLibro);
  res.status(201).json(nuevoLibro);
}

function actualizar(req, res) {
  const id = Number(req.params.id);
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    return res.status(404).json({
      error: { code: "LIBRO_NO_ENCONTRADO", message: `No existe un libro con id ${id}` },
    });
  }

  const { titulo, autor, isbn, stock } = req.body;

  if (titulo !== undefined) libro.titulo = titulo;
  if (autor !== undefined) libro.autor = autor;
  if (isbn !== undefined) libro.isbn = isbn;
  if (stock !== undefined) libro.stock = Number(stock);

  res.json(libro);
}

function eliminar(req, res) {
  const id = Number(req.params.id);
  const indice = libros.findIndex((l) => l.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: { code: "LIBRO_NO_ENCONTRADO", message: `No existe un libro con id ${id}` },
    });
  }

  const eliminado = libros.splice(indice, 1)[0];
  res.json(eliminado);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
