import { Op } from "sequelize";
import { sequelize, BookModel } from "../models/index.js";

// Columnas pedidas explícitamente (evita un SELECT *); todas las lecturas de este DAO la usan
const BOOK_ATTRIBUTES = ["id", "titulo", "autor", "isbn", "stock"];

/**
 * Adaptador DAO para Libros utilizando Sequelize (SQL).
 * Debe respetar exactamente la misma interfaz (mismos métodos públicos) que BooksMemoryDao.
 */
class BooksSequelizeDao {
  // Inicialización de la base de datos (creación de tablas y datos semilla)
  async init() {
    // Sincroniza el modelo con la BD. En producción no se usa force: true ni alter: true, se usan migraciones.
    await sequelize.sync({ alter: true });

    // Siembra de datos si la tabla está vacía
    const count = await BookModel.count();
    if (count === 0) {
      await BookModel.bulkCreate([
        { titulo: "El principito", autor: "Saint-Exupéry", stock: 3 },
        { titulo: "Cien años de soledad", autor: "García Márquez", stock: 1 },
      ]);
    }
  }

  // Lista libros: los filtros, el orden y la paginación los resuelve la BD (WHERE / ORDER BY / LIMIT),
  // no se traen todas las filas para filtrar en JS.
  // filters: { autor, isbn, sort ("titulo" | "-titulo"), page, limit }
  async getAll({ autor, isbn, sort, page = 1, limit } = {}) {
    const where = {};
    if (autor !== undefined) where.autor = { [Op.like]: `%${autor}%` };
    if (isbn !== undefined) where.isbn = isbn;

    const order = [["id", "ASC"]];
    if (sort) order.unshift([sort.replace(/^-/, ""), sort.startsWith("-") ? "DESC" : "ASC"]);

    const books = await BookModel.findAll({
      where,
      attributes: BOOK_ATTRIBUTES,
      order,
      ...(limit && { limit, offset: (page - 1) * limit }),
    });
    // get({ plain: true }) devuelve objetos planos
    return books.map((b) => b.get({ plain: true }));
  }

  // Buscar un libro por ID
  async getById(id) {
    const book = await BookModel.findByPk(id, { attributes: BOOK_ATTRIBUTES });
    return book ? book.get({ plain: true }) : null;
  }

  // Buscar un libro por ISBN
  async getByIsbn(isbn) {
    const book = await BookModel.findOne({ where: { isbn }, attributes: BOOK_ATTRIBUTES });
    return book ? book.get({ plain: true }) : null;
  }

  // Crear un nuevo libro
  async save(data) {
    // Ignoramos el id si viene provisto, la BD asignará uno
    const { id: _ignored, ...bookData } = data;
    // isbn en null explícito para devolver la misma forma que el DAO en memoria
    const newBook = await BookModel.create({ isbn: null, ...bookData });
    return this.getById(newBook.id);
  }

  // Actualizar un libro
  async update(id, changes) {
    const book = await BookModel.findByPk(id, { attributes: BOOK_ATTRIBUTES });
    if (!book) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    await book.update(allowedChanges);
    return book.get({ plain: true });
  }

  // Eliminar un libro
  async delete(id) {
    const deletedCount = await BookModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}

// Exportamos la instancia única (Singleton) y la clase
export { BooksSequelizeDao };
export default new BooksSequelizeDao();
