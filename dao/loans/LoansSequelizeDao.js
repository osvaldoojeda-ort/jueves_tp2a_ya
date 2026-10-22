import { Op, literal } from "sequelize";
import { sequelize, BookModel, UserModel, LoanModel } from "../models/index.js";

// Columnas explícitas (sin SELECT *) y mismas columnas de usuario/libro que el DAO en memoria
const LOAN_ATTRIBUTES = ["id", "userId", "bookId", "fechaPrestamo", "fechaDevolucion"];
const INCLUDE = [
  { model: UserModel, as: "usuario", attributes: ["id", "nombre"] },
  { model: BookModel, as: "libro", attributes: ["id", "titulo"] },
];

/**
 * Adaptador DAO para Préstamos utilizando Sequelize (SQL).
 * Debe respetar la misma interfaz pública que LoansMemoryDao.
 * La tabla `loans` la crea sequelize.sync() desde BooksSequelizeDao.init().
 */
class LoansSequelizeDao {
  // filters: { userId, bookId, activos } (activos: true = sin devolver, false = ya devueltos)
  // userId y bookId aceptan un número o un arreglo de números (Sequelize lo traduce a IN).
  async getAll({ userId, bookId, activos } = {}) {
    const where = {};
    if (userId !== undefined) where.userId = userId;
    if (bookId !== undefined) where.bookId = bookId;
    if (activos !== undefined) where.fechaDevolucion = activos ? null : { [Op.ne]: null };

    const loans = await LoanModel.findAll({
      where,
      attributes: LOAN_ATTRIBUTES,
      include: INCLUDE,
      order: [["id", "ASC"]],
    });
    return loans.map((l) => l.get({ plain: true }));
  }

  async getById(id) {
    const loan = await LoanModel.findByPk(id, { attributes: LOAN_ATTRIBUTES, include: INCLUDE });
    return loan ? loan.get({ plain: true }) : null;
  }

  // Préstamo sin devolver de ese usuario para ese libro (o null)
  async getActive(userId, bookId) {
    const loan = await LoanModel.findOne({
      where: { userId, bookId, fechaDevolucion: null },
      attributes: LOAN_ATTRIBUTES,
      include: INCLUDE,
    });
    return loan ? loan.get({ plain: true }) : null;
  }

  // Descuenta 1 de stock y registra el préstamo en UNA transacción. Devuelve null si no hay stock.
  async lend({ userId, bookId }) {
    const loanId = await sequelize.transaction(async (t) => {
      // UPDATE condicional: descuenta solo si stock > 0 (evita que dos pedidos simultáneos pasen de 0)
      const [affected] = await BookModel.update(
        { stock: literal("stock - 1") },
        { where: { id: bookId, stock: { [Op.gt]: 0 } }, transaction: t }
      );
      if (affected === 0) return null;

      const loan = await LoanModel.create({ userId, bookId }, { transaction: t });
      return loan.id;
    });

    return loanId ? this.getById(loanId) : null;
  }

  // Marca la devolución y repone 1 de stock en UNA transacción. Devuelve null si ya estaba devuelto o no existe.
  async giveBack(id) {
    const done = await sequelize.transaction(async (t) => {
      const [affected] = await LoanModel.update(
        { fechaDevolucion: new Date() },
        { where: { id, fechaDevolucion: null }, transaction: t }
      );
      if (affected === 0) return false;

      const loan = await LoanModel.findByPk(id, { attributes: ["bookId"], transaction: t });
      await BookModel.increment("stock", { by: 1, where: { id: loan.bookId }, transaction: t });
      return true;
    });

    return done ? this.getById(id) : null;
  }
}

export { LoansSequelizeDao };
export default new LoansSequelizeDao();
