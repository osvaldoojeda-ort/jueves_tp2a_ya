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
import createPasswordHasher from "../security/passwordHasher.js";
import createTokenService from "../security/tokenService.js";
import createAuthMiddlewares from "../middlewares/auth.js";
import makeAuthUseCases from "../usecases/auth/makeAuthUseCases.js";
import seedAdmin from "../usecases/auth/seedAdmin.js";
import AuthController from "../controllers/AuthController.js";
import createAuthRouter from "../routes/authRoutes.js";
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, ADMIN_EMAIL, ADMIN_PASSWORD } from "../config/config.js";
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

  // Seguridad: hasheador de contraseñas, servicio de tokens y middlewares de auth
  const hasher = createPasswordHasher({ rounds: BCRYPT_ROUNDS });
  const tokens = createTokenService({ secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN });
  const auth = createAuthMiddlewares(tokens);

  // Administrador inicial (si no existe) para poder iniciar sesión por primera vez
  await seedAdmin({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, usersDao, hasher);

  // 2. Inyectamos los DAOs y el bus en las Factories de Casos de Uso
  const bookUseCases = makeBookUseCases(booksDao, loansDao, events);

  // 3. Inyectamos los Casos de Uso en los Controladores
  const booksController = new BooksController(bookUseCases);

  // 4. Inyectamos los Controladores en los Routers
  const router = Router();
  router.use("/books", createBooksRouter(booksController, auth));

  // Entidad Users
  const usersController = new UsersController(makeUserUseCases(usersDao, loansDao, events, hasher));
  router.use("/users", createUsersRouter(usersController, auth));

  // Autenticación: registro, login y perfil
  const authController = new AuthController(makeAuthUseCases({ usersDao, loansDao, events, hasher, tokens }));
  router.use("/auth", createAuthRouter(authController, auth));

  // Entidad Loans
  const loansController = new LoansController(makeLoanUseCases({ loansDao, booksDao, usersDao, events }));
  router.use("/loans", createLoansRouter(loansController, auth));

  // Retornamos el router principal listo para ser usado por Express
  return router;
}

export default buildContainer;
