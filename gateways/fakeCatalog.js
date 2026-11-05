import AppError from "../errors/AppError.js";

// Datos locales que imitan lo que devolvería la API externa
const FAKE_BOOKS = {
  "9780156012195": {
    titulo: "The Little Prince",
    autores: ["Antoine de Saint-Exupéry"],
    editorial: "HMH Books for Young Readers",
    fechaPublicacion: "2000",
    paginas: 96,
  },
  "9780060883287": {
    titulo: "One hundred years of solitude",
    autores: ["Gabriel García Márquez"],
    editorial: "Harper Perennial Modern Classics",
    fechaPublicacion: "2006",
    paginas: 417,
  },
  "9780140328721": {
    titulo: "Fantastic Mr. Fox",
    autores: ["Roald Dahl"],
    editorial: "Puffin",
    fechaPublicacion: "October 1, 1988",
    paginas: 96,
  },
  "9780802130303": {
    titulo: "Ficciones",
    autores: ["Jorge Luis Borges"],
    editorial: "Grove Press",
    fechaPublicacion: "1994",
    paginas: 174,
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Catálogo falso: misma interfaz que el gateway real, sin red.
 * Cada "pedido" tarda `latencyMs` (como un pedido HTTP real), así se nota la diferencia entre
 * pedir de a uno, en paralelo o en lote, incluso sin internet.
 * Un ISBN que empieza con 000 simula una falla del servidor externo (para probar los errores).
 */
function createFakeCatalog({ latencyMs }) {
  const toInfo = (isbn) => ({ isbn, portada: null, url: null, ...FAKE_BOOKS[isbn] });

  return {
    async getByIsbn(isbn) {
      await sleep(latencyMs);
      if (isbn.startsWith("000")) {
        throw new AppError("EXTERNAL_API_ERROR", "El catálogo externo respondió 500", 502);
      }
      return FAKE_BOOKS[isbn] ? toInfo(isbn) : null;
    },

    async getManyByIsbn(isbns) {
      await sleep(latencyMs); // un solo pedido para todos
      if (isbns.some((isbn) => isbn.startsWith("000"))) {
        throw new AppError("EXTERNAL_API_ERROR", "El catálogo externo respondió 500", 502);
      }
      return Object.fromEntries(isbns.filter((isbn) => FAKE_BOOKS[isbn]).map((isbn) => [isbn, toInfo(isbn)]));
    },
  };
}

export default createFakeCatalog;
