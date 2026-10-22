import AppError from "../../errors/AppError.js";
import EVENTS from "../../events/eventNames.js";
import { LOW_STOCK_THRESHOLD } from "../../config/config.js";

async function createBook(data, dao, usersDao, events) {
  // ... tus validaciones de ISBN y userId quedan IGUAL ...

  const created = await dao.save(data);

  // Un libro puede "nacer" con stock bajo
  if (created.stock <= LOW_STOCK_THRESHOLD) {
    events.emit(EVENTS.BOOK_LOW_STOCK, {
      id: created.id,
      titulo: created.titulo,
      stock: created.stock,
    });
  }

  return created;
}

export default createBook;