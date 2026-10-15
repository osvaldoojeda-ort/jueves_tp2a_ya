import { sequelize } from "../../connection/index.js";
import BookModel from "./BookModel.js";
import UserModel from "./UserModel.js";

// -----------------------------------------------------------------------------
// DEFINICIÓN DE RELACIONES (ASOCIACIONES)
// -----------------------------------------------------------------------------
// Aquí es donde centralizamos cómo se relacionan las tablas entre sí.
// Documentación de Sequelize: https://sequelize.org/docs/v6/core-concepts/assocs/

// Relación de 1 a N (Un Usuario tiene muchos Libros)
// (Suponiendo que el modelo Book representa libros de los cuales el usuario es dueño o tiene prestados)
UserModel.hasMany(BookModel, {
  foreignKey: "userId",
  as: "libros", // Alias para usar en include: [{ model: BookModel, as: 'libros' }]
});

// Relación inversa (Un Libro pertenece a un Usuario)
BookModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "usuario",
});

// Exportamos la instancia de sequelize (para poder hacer sync) y todos los modelos
export { sequelize, BookModel, UserModel };
