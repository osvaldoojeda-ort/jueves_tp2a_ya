/**
 * Catálogo de códigos de error de la API (Clase 15).
 *
 * Para quien consume la API, el `code` es lo más importante de un error: es lo que su programa compara para decidir
 * qué hacer ("si es LOAN_LIMIT_REACHED, mostrá el cartel de tope"). Por eso cada operación documenta qué códigos
 * puede devolver, y acá está el status y un mensaje de ejemplo de cada uno.
 *
 * Los mensajes son EJEMPLOS: el texto real lo decide cada caso de uso (y puede incluir datos, como el tope).
 * Limitación conocida: este catálogo es una copia de lo que lanzan los casos de uso. Si mañana alguien agrega un
 * `new AppError("NUEVO_CODIGO", ...)`, nada obliga a sumarlo acá (ver la sección "lo que NO vimos" del material).
 */
const ERROR_CATALOG = {
  // 400: la forma del pedido
  VALIDATION_ERROR: [400, "Datos de body inválidos"],
  INVALID_STOCK: [400, "El stock no puede ser negativo"],

  // 401: ¿quién sos?
  TOKEN_MISSING: [401, "Falta el header Authorization: Bearer <token>"],
  TOKEN_INVALID: [401, "Token inválido"],
  TOKEN_EXPIRED: [401, "El token venció, iniciá sesión de nuevo"],
  INVALID_CREDENTIALS: [401, "Email o contraseña incorrectos"],

  // 403: ¿podés?
  FORBIDDEN: [403, "No tenés permiso para realizar esta acción"],

  // 404: ¿existe?
  BOOK_NOT_FOUND: [404, "No existe un libro con ese id"],
  USER_NOT_FOUND: [404, "No existe un usuario con ese id"],
  LOAN_NOT_FOUND: [404, "No existe un préstamo con ese id"],

  // 409: el pedido está bien formado, pero choca con el estado actual o con una regla de negocio
  ISBN_DUPLICATE: [409, "Ese ISBN ya está registrado"],
  EMAIL_DUPLICATED: [409, "Ese email ya está registrado"],
  BOOK_HAS_LOANS: [409, "No se puede eliminar un libro con préstamos asociados"],
  USER_HAS_LOANS: [409, "No se puede eliminar un usuario con préstamos asociados"],
  ALREADY_LOANED: [409, "El usuario ya tiene ese libro sin devolver"],
  OUT_OF_STOCK: [409, "No hay stock disponible de ese libro"],
  LOAN_LIMIT_REACHED: [409, "Un usuario puede tener hasta 3 préstamos activos"],
  USER_HAS_OVERDUE_LOANS: [409, "El usuario tiene préstamos vencidos: debe devolverlos antes de pedir otros"],
  ALREADY_RETURNED: [409, "Ese préstamo ya fue devuelto"],
  LOAN_OVERDUE: [409, "El préstamo está vencido: no se puede renovar, hay que devolverlo"],
  RENEWAL_LIMIT_REACHED: [409, "Un préstamo se puede renovar como máximo 1 vez"],
  LOAN_CHANGED: [409, "El préstamo cambió mientras se procesaba el pedido: volvé a intentarlo"],

  // 429: demasiados intentos
  TOO_MANY_ATTEMPTS: [429, "Demasiados intentos fallidos, probá de nuevo en un minuto"],

  // 5xx: falló un tercero (Clase 12)
  EXTERNAL_API_ERROR: [502, "El catálogo externo respondió 500"],
  EXTERNAL_TIMEOUT: [504, "El catálogo externo tardó demasiado en responder"],
};

// Ejemplo de error para la documentación. VALIDATION_ERROR muestra también los `details`.
function errorExample(code) {
  const [, message] = ERROR_CATALOG[code];
  const details = code === "VALIDATION_ERROR" ? [{ field: "titulo", message: "El título es obligatorio" }] : undefined;
  return { error: { code, message, ...(details && { details }) } };
}

export { ERROR_CATALOG, errorExample };
