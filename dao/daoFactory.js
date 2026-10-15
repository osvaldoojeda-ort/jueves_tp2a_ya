import { PERSISTENCE_TYPE } from "../config/config.js";
import booksMemoryDao from "./books/BooksMemoryDao.js";
import booksSequelizeDao from "./books/BooksSequelizeDao.js";
import usersMemoryDao from "./users/UsersMemoryDao.js";
import usersSequelizeDao from "./users/UsersSequelizeDao.js";

/**
 * Factory de DAOs.
 * Retorna la instancia de DAO correcta dependiendo de la variable de entorno.
 */
function getBooksDao() {
  if (PERSISTENCE_TYPE === "sequelize") {
    console.log("[Persistencia] Usando Sequelize (SQLite/SQL)");
    return booksSequelizeDao;
  } else {
    console.log("[Persistencia] Usando Memoria (Array JS)");
    return booksMemoryDao;
  }
}

function getUsersDao() {
  return PERSISTENCE_TYPE === "sequelize" ? usersSequelizeDao : usersMemoryDao;
}

export { getBooksDao, getUsersDao };
