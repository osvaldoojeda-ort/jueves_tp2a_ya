const express = require("express");
const logger = require("./middlewares/logger");
const notFound = require("./middlewares/notFound");
const librosRoutes = require("./routes/librosRoutes");

const app = express();

app.use(logger);
app.use(express.json());

app.use("/libros", librosRoutes);

app.use(notFound);

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
