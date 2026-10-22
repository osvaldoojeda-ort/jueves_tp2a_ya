import { getBooksDao, getUsersDao } from "../dao/daoFactory.js";
import makeBookUseCases from "../useCases/books/makeBookUseCases.js";
import BooksController from "../controllers/booksController.js";
import createBooksRouter from "../routes/booksRoutes.js";
import makeUserUseCases from "../useCases/users/makeUserUseCases.js";
import UsersController from "../controllers/usersController.js";
import createUsersRouter from "../routes/usersRoutes.js";
import { Router } from "express";

import createEventBus from "../events/eventBus.js";
import { getNotifier } from "../notifications/notifierFactory.js";
import registerAlertListeners from "../alerts/registerAlertListeners.js";

/**
 * Composition Root Centralizado.
 * Este módulo se encarga de resolver las dependencias de toda la aplicación,
 * aislando esta responsabilidad de `index.js`.
 */
async function buildContainer() {
  // 1. Instanciamos o resolvemos los DAOs
  const booksDao = getBooksDao();
  if (typeof booksDao.init === "function") {
    await booksDao.init();
  }

  const usersDao = getUsersDao();
  if (typeof usersDao.init === "function") {
    await usersDao.init();
  }

  // 1. Bus de eventos + notificador + listeners
  const events = createEventBus();
  const notifier = getNotifier();
  registerAlertListeners(events, notifier);

  // 2. Inyectamos los DAOs (y ahora el bus) en las Factories de Casos de Uso
  const bookUseCases = makeBookUseCases(booksDao, usersDao, events);

  // 3. Inyectamos los Casos de Uso en los Controladores
  const booksController = new BooksController(bookUseCases);

  // 4. Inyectamos los Controladores en los Routers
  const router = Router();
  router.use("/books", createBooksRouter(booksController));

  // Entidad Users
  const usersController = new UsersController(makeUserUseCases(usersDao, events));
  router.use("/users", createUsersRouter(usersController));

  // Retornamos el router principal listo para ser usado por Express
  return router;
}

export default buildContainer;
