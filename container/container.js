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

// ← NUEVO: seguridad (Clase 11)
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, ADMIN_EMAIL, ADMIN_PASSWORD } from "../config/config.js";
import { createPasswordHasher } from "../security/passwordHasher.js";
import { createTokenService } from "../security/tokenService.js";
import createAuthMiddlewares from "../middlewares/auth.js";
import makeAuthUseCases from "../usecases/auth/makeAuthUseCases.js";
import seedAdmin from "../usecases/auth/seedAdmin.js";
import AuthController from "../controllers/AuthController.js";
import createAuthRouter from "../routes/authRoutes.js";

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

  // Préstamos: tabla intermedia entre usuarios y libros (relación N a N)
  const loansDao = getLoansDao();
  if (typeof loansDao.init === "function") {
    await loansDao.init();
  }

  // Eventos: el bus conecta a quien emite (casos de uso) con quien escucha (alertas)
  const events = createEventBus();
  registerAlertListeners(events, getNotifier());

  // ← NUEVO: seguridad. Único lugar que conoce las implementaciones concretas.
  const hasher = createPasswordHasher({ rounds: BCRYPT_ROUNDS });
  const tokens = createTokenService({ secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN });
  const auth = createAuthMiddlewares(tokens);

  // Ej. 10.1: hash de una contraseña que nadie usa, con el mismo costo que los reales
  const dummyHash = await hasher.hash("dummy-password-que-nadie-usa"); // ← NUEVO
  // ← NUEVO: admin inicial, DESPUÉS de inicializar los DAOs y el bus de eventos
  await seedAdmin({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, usersDao, events, hasher);

  // 2. Inyectamos los DAOs y el bus en las Factories de Casos de Uso
  const bookUseCases = makeBookUseCases(booksDao, loansDao, events);

  // 3. Inyectamos los Casos de Uso en los Controladores
  const booksController = new BooksController(bookUseCases);

  // 4. Inyectamos los Controladores (y los middlewares de auth) en los Routers
  const router = Router();
  router.use("/books", createBooksRouter(booksController, auth)); // ← CAMBIÓ

  // Entidad Users
  const usersController = new UsersController(makeUserUseCases(usersDao, loansDao, events, hasher)); // ← CAMBIÓ
  router.use("/users", createUsersRouter(usersController, auth)); // ← CAMBIÓ

  // Entidad Loans
  const loansController = new LoansController(makeLoanUseCases({ loansDao, booksDao, usersDao, events }));
  router.use("/loans", createLoansRouter(loansController, auth)); // ← CAMBIÓ

  // ← NUEVO: Auth
  const authController = new AuthController(
    makeAuthUseCases({ dao: usersDao, events, hasher, tokens, dummyHash }) // ← CAMBIÓ
  );
  router.use("/auth", createAuthRouter(authController, auth));

  // Retornamos el router principal listo para ser usado por Express
  return router;
}

export default buildContainer;
