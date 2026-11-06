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
    // Clase 13 — R2: fecha límite de devolución. Es un DÍA (AAAA-MM-DD), no un instante: DATEONLY evita
    // que la zona horaria haga vencer un préstamo unas horas antes de tiempo.
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // Clase 13 — R4: cuántas veces se renovó. "Vencido" NO se guarda: se calcula (ver domain/loanStatus.js).
    renovaciones: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Loan",
    tableName: "loans",
    timestamps: false,
    indexes: [
      // Clase 13 — última línea de defensa: un usuario no puede tener dos préstamos ACTIVOS del mismo libro.
      // El caso de uso ya lo chequea (ALREADY_LOANED, buen mensaje), pero dos pedidos simultáneos pueden pasar
      // los dos el chequeo. El índice único PARCIAL (solo filas sin devolver) hace que la base rechace el segundo.
      // Si ya tenías database.sqlite de una clase anterior, borralo: sync() sin alter no agrega columnas ni índices.
      { name: "loans_active_user_book", unique: true, fields: ["userId", "bookId"], where: { fechaDevolucion: null } },
    ],
  }
);

export default LoanModel;
