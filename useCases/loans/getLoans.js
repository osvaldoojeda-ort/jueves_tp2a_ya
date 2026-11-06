import AppError from "../../errors/AppError.js";
import { addCalendarDays } from "../../domain/businessDays.js";
import { withStatus } from "../../domain/loanStatus.js";

/**
 * Caso de Uso: Listar préstamos con filtros opcionales (userId, bookId, activos, desde, hasta).
 * Regla de acceso: un lector solo ve sus propios préstamos; el administrador ve todos.
 * Clase 13: `desde` y `hasta` son DÍAS (AAAA-MM-DD) en la zona de la biblioteca; se traducen a instantes
 * para filtrar `fechaPrestamo` en la base: [inicio de `desde`, inicio del día siguiente a `hasta`).
 * Cada préstamo vuelve con su `estado` calculado (activo / vencido / devuelto) y sus `diasAtraso`.
 */
async function getLoans(filters = {}, actor, { loansDao, clock }) {
  const { desde, hasta, ...rest } = filters;
  const daoFilters = {
    ...rest,
    ...(desde && { prestadoDesde: clock.startOfDay(desde) }),
    ...(hasta && { prestadoAntesDe: clock.startOfDay(addCalendarDays(hasta, 1)) }),
  };

  if (actor.rol !== "admin") {
    if (filters.userId !== undefined && filters.userId !== actor.id) {
      throw new AppError("FORBIDDEN", "No tenés permiso para ver préstamos de otros usuarios", 403);
    }
    daoFilters.userId = actor.id;
  }

  const today = clock.today();
  const loans = await loansDao.getAll(daoFilters);
  return loans.map((loan) => withStatus(loan, today));
}

export default getLoans;
