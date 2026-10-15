import { getBooksDao, getUsersDao } from "../dao/daoFactory.js";
import makeBookUseCases from "../usecases/books/makeBookUseCases.js";
import BooksController from "../controllers/BooksController.js";
import createBooksRouter from "../routes/booksRoutes.js";
import makeUserUseCases from "../usecases/users/makeUserUseCases.js";
import UsersController from "../controllers/UsersController.js";
import createUsersRouter from "../routes/usersRoutes.js";
import { Router } from "express";

/**
 * Composition Root Centralizado.
 * Este módulo se encarga de resolver las dependencias de toda la aplicación,
 * aislando esta responsabilidad de `index.js`.
 */
async function buildContainer() {
  // 1. Instanciamos o resolvemos los DAOs
  const booksDao = getBooksDao();

  // Si el DAO seleccionado tiene un método init (ej. Sequelize), lo ejecutamos
  if (typeof booksDao.init === "function") {
    await booksDao.init();
  }

  const usersDao = getUsersDao();
  if (typeof usersDao.init === "function") {
    await usersDao.init();
  }

  // 2. Inyectamos los DAOs en las Factories de Casos de Uso
  const bookUseCases = makeBookUseCases(booksDao, usersDao);

  // 3. Inyectamos los Casos de Uso en los Controladores
  const booksController = new BooksController(bookUseCases);

  // 4. Inyectamos los Controladores en los Routers
  const router = Router();
  router.use("/books", createBooksRouter(booksController));

  // Entidad Users
  const usersController = new UsersController(makeUserUseCases(usersDao));
  router.use("/users", createUsersRouter(usersController));

  // Retornamos el router principal listo para ser usado por Express
  return router;
}

export default buildContainer;
