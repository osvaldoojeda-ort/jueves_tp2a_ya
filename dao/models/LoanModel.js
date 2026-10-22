import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

/**
 * Tabla intermedia de la relación N a N entre usuarios y libros: un préstamo.
 * Un usuario puede tener muchos libros y un libro puede estar en manos de muchos usuarios
 * (mientras haya stock). Además de las dos claves foráneas guarda datos propios de la relación.
 */
class LoanModel extends Model {}

LoanModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // userId y bookId los crea la asociación (ver models/index.js)
    fechaPrestamo: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaDevolucion: {
      type: DataTypes.DATE,
      allowNull: true, // null = préstamo activo (todavía no se devolvió)
    },
  },
  {
    sequelize,
    modelName: "Loan",
    tableName: "loans",
    timestamps: false,
  }
);

export default LoanModel;
