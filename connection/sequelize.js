import { Sequelize } from "sequelize";

// Configuración básica de Sequelize usando SQLite en memoria
// (Podría ser 'sqlite:./database.sqlite' para persistir en disco local)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",//:memory: para no guardar nada.
  logging: false, // Cambiar a console.log para ver las queries SQL
});

export default sequelize;
