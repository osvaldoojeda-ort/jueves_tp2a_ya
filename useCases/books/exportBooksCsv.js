import AppError from "../../errors/AppError.js";
import { toCsv } from "../../utils/csv.js";

// Columnas del archivo: las propias de cada libro y las que vienen del catálogo externo
const COLUMNS = [
  { header: "id", value: (b) => b.id },
  { header: "titulo", value: (b) => b.titulo },
  { header: "autor", value: (b) => b.autor },
  { header: "isbn", value: (b) => b.isbn },
  { header: "stock", value: (b) => b.stock },
];
const ENRICHED_COLUMNS = [
  { header: "editorial", value: (b) => b.info?.editorial },
  { header: "paginas", value: (b) => b.info?.paginas },
  { header: "fecha_publicacion", value: (b) => b.info?.fechaPublicacion },
];

/**
 * Caso de Uso: Exportar libros a CSV, con datos del catálogo externo si se pide (`enriquecer`).
 * Usa los mismos filtros que el listado (autor, isbn, sort, page, limit) a través de `getBooks`.
 * El enriquecimiento se hace con UN solo pedido en lote al catálogo para todos los ISBN.
 * Si el catálogo no responde, igual se exporta lo local y se informa en `enrichment`.
 * Devuelve { csv, filename, enrichment: "skipped" | "ok" | "unavailable" }.
 */
async function exportBooksCsv({ enriquecer, separador = ",", ...filters }, getBooks, catalog) {
  const books = await getBooks(filters);

  let infoByIsbn = {};
  let enrichment = "skipped";

  if (enriquecer) {
    const isbns = books.map((b) => b.isbn).filter(Boolean);
    try {
      infoByIsbn = isbns.length > 0 ? await catalog.getManyByIsbn(isbns) : {};
      enrichment = "ok";
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      enrichment = "unavailable";
    }
  }

  // Transformación: cada libro local + lo que se encontró afuera
  const rows = books.map((book) => ({ ...book, info: infoByIsbn[book.isbn] }));
  const columns = enriquecer ? [...COLUMNS, ...ENRICHED_COLUMNS] : COLUMNS;

  return {
    csv: toCsv(rows, columns, { separator: separador }),
    filename: `libros-${new Date().toISOString().slice(0, 10)}.csv`,
    enrichment,
  };
}

export default exportBooksCsv;
