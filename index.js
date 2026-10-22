import express from "express";
import logger from "./middlewares/logger.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import { PORT } from "./config/config.js";
import buildContainer from "./container/container.js";

async function startServer() {
  const app = express();

  // Middlewares globales
  app.use(logger);
  app.use(express.json());

  // Obtenemos el router centralizado desde nuestro Composition Root (Container)
  try {
    const router = await buildContainer();
    app.use(router);
  } catch (err) {
    console.error("Error al inicializar el contenedor de dependencias:", err);
    process.exit(1);
  }

  // Manejadores de cierre
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Servidor Express (Clase 10) corriendo en http://localhost:${PORT}`);
  });
}

startServer();
