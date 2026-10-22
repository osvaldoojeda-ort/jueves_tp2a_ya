import { getBooksDao, getUsersDao, getLoansDao } from "../dao/daoFactory.js";
import makeBookUseCases from "../usecases/books/makeBookUseCases.js";
import BooksController from "../controllers/BooksController.js";
import createBooksRouter from "../routes/booksRoutes.js";
import makeUserUseCases from "../usecases/users/makeUserUseCases.js";
import UsersController from "../controllers/UsersController.js";
import createUsersRouter from "../routes/usersRoutes.js";
import makeLoanUseCases from "../usecases/loans/makeLoanUseCases.js";
import LoansController from "../controllers/LoansController.js";
import createLoansRouter from "../routes/loansRoutes.js";
import createEventBus from "../events/eventBus.js";
import { getNotifier } from "../notifications/notifierFactory.js";
import registerAlertListeners from "../alerts/registerAlertListeners.js";
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

  // Préstamos: tabla intermedia entre usuarios y libros (relación N a N)
  const loansDao = getLoansDao();
  if (typeof loansDao.init === "function") {
    await loansDao.init();
  }

  // Eventos: el bus conecta a quien emite (casos de uso) con quien escucha (alertas)
  const events = createEventBus();
  registerAlertListeners(events, getNotifier());

  // 2. Inyectamos los DAOs y el bus en las Factories de Casos de Uso
  const bookUseCases = makeBookUseCases(booksDao, loansDao, events);

  // 3. Inyectamos los Casos de Uso en los Controladores
  const booksController = new BooksController(bookUseCases);

  // 4. Inyectamos los Controladores en los Routers
  const router = Router();
  router.use("/books", createBooksRouter(booksController));

  // Entidad Users
  const usersController = new UsersController(makeUserUseCases(usersDao, loansDao, events));
  router.use("/users", createUsersRouter(usersController));

  // Entidad Loans
  const loansController = new LoansController(makeLoanUseCases({ loansDao, booksDao, usersDao, events }));
  router.use("/loans", createLoansRouter(loansController));

  // Retornamos el router principal listo para ser usado por Express
  return router;
}

export default buildContainer;
