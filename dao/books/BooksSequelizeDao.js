import { sequelize, BookModel, UserModel } from "../models/index.js";

// Columnas pedidas explícitamente (evita un SELECT * y no expone datos de más del usuario)
const BOOK_ATTRIBUTES = ["id", "titulo", "autor", "isbn", "stock", "userId"];
const USER_ATTRIBUTES = ["id", "nombre"];
const INCLUDE_USER = [{ model: UserModel, as: "usuario", attributes: USER_ATTRIBUTES }];

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

  // Obtener todos los libros
  async getAll() {
    // Incluimos al usuario propietario (alias "usuario"); get({ plain: true }) devuelve objetos planos
    const books = await BookModel.findAll({ attributes: BOOK_ATTRIBUTES, include: INCLUDE_USER });
    return books.map((b) => b.get({ plain: true }));
  }

  // Buscar un libro por ID
  async getById(id) {
    const book = await BookModel.findByPk(id, { attributes: BOOK_ATTRIBUTES, include: INCLUDE_USER });
    return book ? book.get({ plain: true }) : null;
  }

  // Buscar un libro por ISBN
  async getByIsbn(isbn) {
    const book = await BookModel.findOne({ where: { isbn } });
    return book ? book.get({ plain: true }) : null;
  }

  // Crear un nuevo libro
  async save(data) {
    // Ignoramos el id si viene provisto, la BD asignará uno
    const { id: _ignored, ...bookData } = data;
    // isbn y userId en null explícito para devolver la misma forma que el DAO en memoria
    const newBook = await BookModel.create({ isbn: null, userId: null, ...bookData });
    return newBook.get({ plain: true });
  }

  // Actualizar un libro
  async update(id, changes) {
    const book = await BookModel.findByPk(id);
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
