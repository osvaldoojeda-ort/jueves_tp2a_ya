import AppError from "../../errors/AppError.js";

// Reflexión: ¿por qué el catch verifica `instanceof AppError` y no atrapa cualquier error?
// Los AppError del gateway son fallas ESPERABLES de un tercero (timeout, 5xx, sin red) y tienen una salida
// prevista: degradar. Cualquier otro error (un TypeError por un bug nuestro) es inesperado: si lo tragáramos,
// el endpoint respondería "unavailable" y el bug quedaría escondido en lugar de verse en los logs.

/**
 * Caso de Uso: Detalle de un libro enriquecido con datos del catálogo externo.
 * Devuelve el libro (con `externalInfo` y `externalStatus`) o `null` si no existe.
 * Regla: el catálogo externo es un EXTRA. Si no responde, el libro local igual se devuelve
 * (degradación elegante): una caída de afuera no debe romper algo que sí tenemos nosotros.
 */
async function getBookDetails(id, dao, catalog) {
  const book = await dao.getById(id);
  if (!book) return null;

  if (!book.isbn) {
    return { ...book, externalInfo: null, externalStatus: "no_isbn" };
  }

  try {
    const info = await catalog.getByIsbn(book.isbn);
    return { ...book, externalInfo: info, externalStatus: info ? "ok" : "not_found" };
  } catch (err) {
    // Solo se absorben los errores del catálogo (AppError). Un bug nuestro (TypeError...) tiene que seguir explotando.
    if (!(err instanceof AppError)) throw err;
    return { ...book, externalInfo: null, externalStatus: "unavailable" };
  }
}

export default getBookDetails;
