/**
 * Validación del dígito de control de un ISBN-13 (regla de FORMA: se decide mirando solo el dato).
 * Se multiplican los primeros 12 dígitos alternando por 1 y por 3, se suman,
 * y el dígito de control es lo que falta para llegar a la decena siguiente.
 * Ej: 978015601219 → suma 105 → 10 - (105 % 10) = 5 → 9780156012195 es válido.
 * Supone que ya se validó que son exactamente 13 dígitos (por eso en el esquema va DESPUÉS del regex).
 */
function hasValidIsbn13Checksum(isbn) {
  const digits = [...isbn].map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

export { hasValidIsbn13Checksum };
