import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";
import { isOverdue, withStatus } from "../../domain/loanStatus.js";
import calculateDueDate from "./calculateDueDate.js";

// Ejercicio 8.6 — Status codes de POST /loans:
//   | Situación                        | Status | code                                         |
//   |----------------------------------|--------|----------------------------------------------|
//   | Body sin bookId                  | 400    | VALIDATION_ERROR (Zod, en el router)         |
//   | Sin token                        | 401    | TOKEN_MISSING (middleware authenticate)      |
//   | Un lector pide a nombre de otro  | 403    | FORBIDDEN                                    |
//   | El libro no existe               | 404    | BOOK_NOT_FOUND                               |
//   | Ya tiene 3 préstamos activos     | 409    | LOAN_LIMIT_REACHED                           |
//   | Tiene un préstamo vencido        | 409    | USER_HAS_OVERDUE_LOANS                       |
//   | No hay stock                     | 409    | OUT_OF_STOCK                                 |
//   | La API de feriados está caída    | 201    | — (degrada: holidaysAvailable: false)        |
//
// Ejercicio 5.4 — ¿Por qué los feriados se consultan DESPUÉS de las reglas? Porque es lo más caro (un pedido a un
// tercero) y fail fast: si el pedido igual va a ser rechazado por R1 o R3, no tiene sentido gastar ese pedido.
//
// Ejercicio 1.2 — El tope es configuración: si la biblioteca decide que son 5, se cambia una variable de entorno
// sin tocar ni redesplegar código, y en los tests se puede pasar cualquier valor.

/**
 * Caso de Uso: Prestar un libro a un usuario.
 * Reglas, en orden del chequeo más barato al más caro (fail fast):
 *  1. Permiso (403): un lector solo puede pedir libros para sí mismo; el admin puede indicar `userId`.
 *  2. Existencia (404): el usuario y el libro deben existir.
 *  3. Estado (409): el usuario no puede tener ya ese libro sin devolver (ALREADY_LOANED).
 *  4. R3 (409): un usuario con algún préstamo vencido no puede pedir libros nuevos (USER_HAS_OVERDUE_LOANS).
 *  5. R1 (409): como máximo `maxActive` préstamos activos (LOAN_LIMIT_REACHED).
 *  6. R2: el préstamo vence a los `businessDays` días hábiles (sin fines de semana ni feriados).
 *  7. Stock (409): el descuento y el préstamo se registran juntos en el DAO (OUT_OF_STOCK).
 * Efecto secundario desacoplado: si el stock queda bajo, emite "book.lowStock".
 *
 * Reflexión (clase 11): ¿por qué el permiso va acá y no en el router con authorize()?
 * authorize("admin") solo mira el ROL. Esta regla depende de los DATOS del pedido (el userId comparado con el actor),
 * y tiene que valer aunque mañana el caso de uso se invoque desde otro lado (un script, un evento, un test).
 *
 * Clase 13: ninguna regla lee process.env, new Date() ni fetch. Los números (loanRules), el reloj (clock)
 * y los feriados (holidays) llegan inyectados: el caso de uso es determinista y se puede testear.
 */
async function createLoan(data, actor, { loansDao, booksDao, usersDao, events, clock, holidays, loanRules, lowStockThreshold }) {
  const { bookId } = data;
  const userId = data.userId ?? actor.id;
  if (actor.rol !== "admin" && userId !== actor.id) {
    throw new AppError("FORBIDDEN", "Solo podés pedir préstamos a tu nombre", 403);
  }

  const user = await usersDao.getById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
  }

  const book = await booksDao.getById(bookId);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "No existe un libro con ese id", 404);
  }

  // Una sola consulta alcanza para las tres reglas que miran los préstamos activos del usuario
  const today = clock.today();
  const activeLoans = await loansDao.getAll({ userId, activos: true });

  if (activeLoans.some((loan) => loan.bookId === bookId)) {
    throw new AppError("ALREADY_LOANED", "El usuario ya tiene ese libro sin devolver", 409);
  }

  // R3 va antes que R1: si tiene un préstamo vencido, el mensaje útil es "devolvelo", no "llegaste al tope"
  const overdue = activeLoans.filter((loan) => isOverdue(loan, today));
  if (overdue.length > 0) {
    throw new AppError(
      "USER_HAS_OVERDUE_LOANS",
      "El usuario tiene préstamos vencidos: debe devolverlos antes de pedir otros",
      409,
      overdue.map((loan) => ({ loanId: loan.id, bookId: loan.bookId, fechaVencimiento: loan.fechaVencimiento }))
    );
  }

  // R1: el tope es configuración, y el mensaje dice cuál es (el cliente entiende el motivo sin adivinar)
  if (activeLoans.length >= loanRules.maxActive) {
    throw new AppError(
      "LOAN_LIMIT_REACHED",
      `Un usuario puede tener hasta ${loanRules.maxActive} préstamos activos`,
      409
    );
  }

  // R2: recién ahora, con todas las reglas superadas, se consulta la API de feriados (lo más caro va al final)
  const { fechaVencimiento, holidaysAvailable } = await calculateDueDate({
    fromDate: today,
    businessDays: loanRules.businessDays,
    holidays,
  });

  // Nota: entre el conteo de arriba y este alta, otro pedido simultáneo podría colarse (condición de carrera).
  // El duplicado del mismo libro lo frena el índice único de la base; el tope de 3 quedaría como ejercicio avanzado.
  const loan = await loansDao.lend({ userId, bookId, fechaPrestamo: clock.now(), fechaVencimiento });
  if (!loan) {
    throw new AppError("OUT_OF_STOCK", "No hay stock disponible de ese libro", 409);
  }

  const updatedBook = await booksDao.getById(bookId);
  if (updatedBook.stock <= lowStockThreshold) {
    events.emit(EVENTS.BOOK_LOW_STOCK, { id: updatedBook.id, titulo: updatedBook.titulo, stock: updatedBook.stock });
  }

  return { ...withStatus(loan, today), holidaysAvailable };
}

export default createLoan;
