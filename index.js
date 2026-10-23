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

// startServer();

// concepts.js
import { createHash, createCipheriv, randomBytes, createHmac } from "node:crypto";

// // 1. Encoding: base64 se revierte con una línea, no hay secreto
const encoded = Buffer.from("hola").toString("base64");
console.log("Encoding:", encoded, Buffer.from(encoded, "base64").toString()); // aG9sYQ== hola

// // 2. Hash: mismo input, mismo output, y no hay forma de volver
console.log("Hashing:",createHash("sha256").update("hola").digest("hex"));
console.log("Hashing:",createHash("sha256").update("hola").digest("hex"));
console.log("Hashing:",createHash("sha256").update("iutduty+hola").digest("hex"));
console.log("Hashing:",createHash("sha256").update("oyuiug+hola").digest("hex"));

// // 3. Encriptación: con la clave se recupera el original
 const key = randomBytes(32);const iv = randomBytes(16);
 const cipher = createCipheriv("aes-256-cbc", key, iv);
console.log("Encryption:",cipher.update("hola", "utf8", "hex") + cipher.final("hex"));

// // 4. Firma (HMAC): el texto queda visible, pero no se puede alterar sin la clave
console.log("HMAC:",createHmac("sha256", "mi-secreto").update("hola").digest("hex"));
