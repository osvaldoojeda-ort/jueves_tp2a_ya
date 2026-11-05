import lookupIsbns from "./lookupIsbns.js";

/**
 * Factory de Casos de Uso del catálogo externo.
 * Recibe el catálogo (gateway real o falso) e inyecta la dependencia en cada caso de uso.
 */
function makeCatalogUseCases(catalog) {
  return {
    lookupIsbns: (params) => lookupIsbns(params, catalog),
  };
}

export default makeCatalogUseCases;
