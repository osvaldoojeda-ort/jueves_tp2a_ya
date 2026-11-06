import { daysBetween } from "./businessDays.js";

/**
 * Estado de un préstamo (Clase 13, regla R3).
 * "Vencido" es un estado CALCULADO, no guardado: depende de qué día es hoy.
 * Si fuera una columna, alguien tendría que actualizarla cada noche, y si ese proceso falla, la base miente.
 *
 * Se guardan los HECHOS (fechaPrestamo, fechaVencimiento, fechaDevolucion, renovaciones);
 * se DERIVAN las conclusiones (estado, diasAtraso).
 *
 * Ejercicio 3.6 — ¿Por qué no una columna `estado = "vencido"`? Porque nadie "vence" un préstamo: pasa el tiempo.
 * Haría falta un proceso nocturno que la actualice, y si ese proceso falla un día, la base miente. Calculado, siempre es
 * correcto, y con un reloj fijo se puede probar cualquier fecha.
 */

// Un préstamo está vencido si NO se devolvió y su fecha límite ya pasó
const isOverdue = (loan, today) => loan.fechaDevolucion === null && loan.fechaVencimiento < today;

function loanStatus(loan, today) {
  if (loan.fechaDevolucion !== null) return "devuelto";
  return isOverdue(loan, today) ? "vencido" : "activo";
}

// Agrega los campos calculados a la respuesta (no se persisten)
function withStatus(loan, today) {
  if (!loan) return loan;
  return {
    ...loan,
    estado: loanStatus(loan, today),
    diasAtraso: isOverdue(loan, today) ? daysBetween(loan.fechaVencimiento, today) : 0,
  };
}

export { isOverdue, loanStatus, withStatus };
