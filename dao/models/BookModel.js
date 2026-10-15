import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

class BookModel extends Model {}

BookModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false, // Constraint a nivel BD
      validate: {
        notEmpty: { msg: "El título no puede estar vacío" }, // Validación a nivel ORM
      },
    },
    autor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Constraint a nivel BD
      validate: {
        len: {
          args: [10, 13],
          msg: "El ISBN debe tener entre 10 y 13 caracteres",
        },
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "El stock no puede ser negativo",
        },
      },
    },
  },
  {
    sequelize, // Pasamos la instancia de conexión
    modelName: "Book",
    tableName: "books",
    timestamps: false,
  }
);

export default BookModel;
