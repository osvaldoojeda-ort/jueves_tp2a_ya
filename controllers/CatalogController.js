/**
 * Controlador del catálogo externo.
 * Recibe los casos de uso por inyección de dependencias; no conoce el gateway ni la API de afuera.
 */
class CatalogController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // GET /catalog/lookup?isbns=...&mode=sequential|parallel|batch
  lookup = async (req, res) => {
    res.json(await this.#useCases.lookupIsbns(req.query));
  };
}

export default CatalogController;
