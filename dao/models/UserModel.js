import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

class UserModel extends Model {}

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es obligatorio" },
        len: [2, 50],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Debe ser un correo electrónico válido" },
      },
    },
    // Hash bcrypt de la contraseña (nunca la contraseña en texto plano). Los DAOs no lo devuelven en las lecturas comunes.
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.STRING,
      defaultValue: "lector", // 'lector' o 'admin'
      validate: {
        isIn: {
          args: [["lector", "admin"]],
          msg: "El rol debe ser 'lector' o 'admin'",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
  }
);

export default UserModel;
