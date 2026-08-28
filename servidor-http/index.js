// servidor-http/index.js
// Servidor HTTP puro (sin Express), solo para entender qué resuelve un
// framework por debajo. Requiere el JSON de biblioteca-api directo (Node
// puede hacer require de un .json, te devuelve el array ya parseado).

const http = require("http");
const libros = require("../biblioteca-api/data/libros.json");

const servidor = http.createServer((req, res) => {
  console.log(req.method, req.url);

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ mensaje: "Biblioteca API" }));
    return;
  }

  if (req.method === "GET" && req.url === "/libros") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(libros));
    return;
  }

  // Desafío opcional: leer el body de un POST a mano, sin Express.
  if (req.method === "POST" && req.url === "/eco") {
    let cuerpoCrudo = "";

    req.on("data", (chunk) => {
      cuerpoCrudo += chunk;
    });

    req.on("end", () => {
      try {
        const datos = JSON.parse(cuerpoCrudo);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(datos));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "JSON inválido en el body" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

const PORT = 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
