import AppError from "../../errors/AppError.js";

/**
 * Reglas de autorización por dueño para préstamos.
 * actor = req.user ({ id, rol }) que deja el middleware authenticate.
 */
const isAdmin = (actor) => actor.rol === "admin";

// Lanza 403 si el actor es lector y el userId no es el suyo
function assertOwnerOrAdmin(actor, userId) {
  if (isAdmin(actor)) return;
  if (Number(userId) !== actor.id) {
    throw new AppError("FORBIDDEN", "No podés operar sobre préstamos de otro usuario", 403);
  }
}

export { isAdmin, assertOwnerOrAdmin };