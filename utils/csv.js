// Utilidad para generar CSV (formato RFC 4180) a mano, sin librerías.

// Un texto que empieza con estos caracteres, abierto en Excel o Sheets, se interpreta como FÓRMULA
// (ej. =HYPERLINK(...)): se llama "CSV injection". Se neutraliza anteponiendo un apóstrofe.
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function escapeCell(value, separator = ",") {
  if (value === null || value === undefined) return "";

  let text = String(value);
  // Los números negativos (tipo number) son legítimos: solo se protegen los TEXTOS
  if (typeof value === "string" && FORMULA_PREFIXES.some((p) => text.startsWith(p))) {
    text = `'${text}`;
  }

  // Si tiene el separador, comillas o un salto de línea, va entre comillas y las comillas internas se duplican
  return /["\r\n]/.test(text) || text.includes(separator) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Convierte un arreglo de objetos en texto CSV.
 * columns: [{ header: "titulo", value: (row) => row.titulo }, ...]
 * - separator: "," por defecto; ";" es el que usa Excel configurado en español (la coma es el separador decimal).
 * - Separador de líneas \r\n (lo que define el RFC 4180).
 * - Empieza con BOM (\uFEFF) para que Excel interprete bien los acentos (UTF-8).
 */
function toCsv(rows, columns, { separator = "," } = {}) {
  const header = columns.map((c) => escapeCell(c.header, separator)).join(separator);
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.value(row), separator)).join(separator));
  return "\uFEFF" + [header, ...lines].join("\r\n") + "\r\n";
}

export { toCsv, escapeCell };
