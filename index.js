import express from "express";
import logger from "./middlewares/logger.js";
import router from "./routes/router.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Middlewares globales: el orden es el orden de ejecución
app.use(logger);
app.use(express.json());

app.use("/app", router);

// Cierre de la fila (Ej. 5): primero el 404 de rutas, al final el manejador de errores
app.use(notFound);
app.use(errorHandler);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
