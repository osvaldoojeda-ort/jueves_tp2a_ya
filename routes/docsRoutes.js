import express from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Factory de Router de la documentación (Clase 15).
 *   GET /openapi.json  el contrato "crudo", para máquinas: Postman lo importa, un generador de clientes lo lee.
 *   GET /docs          Swagger UI: la misma información, para personas, con "Try it out".
 *
 * Recibe el documento ya armado (no lo construye): el router no decide qué se documenta, solo cómo se sirve.
 *
 * Ejercicio 6.4 — El curl que muestra Swagger UI para POST /loans:
 *   curl -X 'POST' 'http://localhost:8000/loans' \
 *     -H 'accept: application/json' \
 *     -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...' \
 *     -H 'Content-Type: application/json' \
 *     -d '{ "bookId": 1 }'
 *
 * Ejercicio 6.5 — ¿Qué pasa con DELETE /books/1 desde "Try it out"? Se borra el libro 1 DE VERDAD: Swagger UI no
 * simula nada, le pega al servidor de `servers`. Si esa URL fuera la de producción, se borraría en producción.
 *
 * ¿Apagar la documentación en producción hace más segura la API? No alcanza: un atacante prueba URLs igual, con o sin
 * mapa (seguridad por oscuridad). Lo que protege es que cada endpoint verifique token, rol y dueño. Apagarla reduce
 * cuánto cuesta encontrar un problema y evita usos accidentales de "Try it out", pero no arregla nada.
 */
function createDocsRouter(spec) {
  const router = express.Router();

  router.get("/openapi.json", (req, res) => res.json(spec));

  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "Biblioteca API — Docs",
      swaggerOptions: {
        persistAuthorization: true, // el token pegado en "Authorize" sobrevive a un F5
        displayRequestDuration: true, // muestra cuánto tardó cada pedido (útil con el catálogo externo)
        tryItOutEnabled: true,
      },
    })
  );

  return router;
}

export default createDocsRouter;
