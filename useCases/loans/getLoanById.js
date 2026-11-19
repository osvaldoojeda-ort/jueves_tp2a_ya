import AppError from "../../errors/AppError.js";
import { withStatus } from "../../domain/loanStatus.js";

/**
 * Caso de Uso: Obtener un préstamo por ID.
 * Devuelve el préstamo (con su estado calculado) o `null` si no existe (el 404 lo decide el controlador).
 * Regla de acceso: un lector solo puede ver sus propios préstamos.
 *
 * Ejercicio 9.3 — Si un lector pide GET /loans/5 y es de otra persona: ¿403 o 404? Decisión: 403.
 *  - Los ids son correlativos: saber que "existe el préstamo 5" no revela nada (cualquiera lo deduce).
 *    Lo privado es el CONTENIDO (quién se llevó qué libro), y el 403 no lo muestra.
 *  - Es coherente con renovar y devolver (C15 responde 403) y con el orden que usamos en toda la API:
 *    existencia (404) → permiso (403) → estado (409). Un 404 "mentiroso" acá rompería esa regla.
 *  - Al cliente le sirve: 403 dice "existe, pero no es tuyo"; 404 lo haría pensar que se borró.
 * Cuándo convendría 404: si los ids fueran adivinables Y su sola existencia fuera sensible (ej. ids que
 * codifican datos), para no permitir enumerar recursos ajenos. No es nuestro caso.
 */
async function getLoanById(id, actor, { loansDao, clock }) {
  const loan = await loansDao.getById(id);
  if (loan && actor.rol !== "admin" && loan.userId !== actor.id) {
    throw new AppError("FORBIDDEN", "No tenés permiso para ver este préstamo", 403);
  }
  return withStatus(loan, clock.today());
}

export default getLoanById;