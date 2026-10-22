import { sequelize } from "../../connection/index.js";
import BookModel from "./BookModel.js";
import UserModel from "./UserModel.js";
import LoanModel from "./LoanModel.js";

// -----------------------------------------------------------------------------
// DEFINICIÓN DE RELACIONES (ASOCIACIONES)
// -----------------------------------------------------------------------------
// Aquí es donde centralizamos cómo se relacionan las tablas entre sí.
// Documentación de Sequelize: https://sequelize.org/docs/v6/core-concepts/assocs/

// Relación N a N (Un Usuario tiene muchos Libros y un Libro está en muchos Usuarios)
// La tabla intermedia es Loan (préstamos). `through.unique: false` permite que el mismo usuario
// pida el mismo libro más de una vez a lo largo del tiempo (historial).
UserModel.belongsToMany(BookModel, {
  through: { model: LoanModel, unique: false },
  foreignKey: "userId",
  otherKey: "bookId",
  as: "libros", // include: [{ model: BookModel, as: 'libros' }]
});

BookModel.belongsToMany(UserModel, {
  through: { model: LoanModel, unique: false },
  foreignKey: "bookId",
  otherKey: "userId",
  as: "usuarios",
});

// Relaciones directas con el préstamo: permiten incluir usuario y libro al consultar préstamos
LoanModel.belongsTo(UserModel, { foreignKey: "userId", as: "usuario" });
LoanModel.belongsTo(BookModel, { foreignKey: "bookId", as: "libro" });

// Exportamos la instancia de sequelize (para poder hacer sync) y todos los modelos
export { sequelize, BookModel, UserModel, LoanModel };
