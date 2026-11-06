import { Op, literal, UniqueConstraintError } from "sequelize";
import AppError from "../../errors/AppError.js";
import { sequelize, BookModel, UserModel, LoanModel } from "../models/index.js";

// Columnas explícitas (sin SELECT *) y mismas columnas de usuario/libro que el DAO en memoria
const LOAN_ATTRIBUTES = ["id", "userId", "bookId", "fechaPrestamo", "fechaVencimiento", "fechaDevolucion", "renovaciones"];
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
  // filters: { userId, bookId, activos, prestadoDesde, prestadoAntesDe }
  //  - activos: true = sin devolver, false = ya devueltos
  //  - userId y bookId aceptan un número o un arreglo de números (Sequelize lo traduce a IN).
  //  - prestadoDesde (inclusive) y prestadoAntesDe (exclusive) son instantes (Date) sobre fechaPrestamo.
  async getAll({ userId, bookId, activos, prestadoDesde, prestadoAntesDe } = {}) {
    const where = {};
    if (userId !== undefined) where.userId = userId;
    if (bookId !== undefined) where.bookId = bookId;
    if (activos !== undefined) where.fechaDevolucion = activos ? null : { [Op.ne]: null };
    if (prestadoDesde !== undefined || prestadoAntesDe !== undefined) {
      where.fechaPrestamo = {
        ...(prestadoDesde !== undefined && { [Op.gte]: prestadoDesde }),
        ...(prestadoAntesDe !== undefined && { [Op.lt]: prestadoAntesDe }),
      };
    }

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
  // Las fechas las decide el caso de uso (que tiene el reloj inyectado); el DAO solo las guarda.
  async lend({ userId, bookId, fechaPrestamo, fechaVencimiento }) {
    let loanId;
    try {
      loanId = await sequelize.transaction(async (t) => {
        // UPDATE condicional: descuenta solo si stock > 0 (evita que dos pedidos simultáneos pasen de 0)
        const [affected] = await BookModel.update(
          { stock: literal("stock - 1") },
          { where: { id: bookId, stock: { [Op.gt]: 0 } }, transaction: t }
        );
        if (affected === 0) return null;

        const loan = await LoanModel.create({ userId, bookId, fechaPrestamo, fechaVencimiento }, { transaction: t });
        return loan.id;
      });
    } catch (err) {
      // El índice único parcial rechazó un segundo préstamo activo del mismo libro (pedidos simultáneos).
      // La transacción se deshizo entera (el stock también). El adaptador traduce el error de la base a uno del dominio.
      if (err instanceof UniqueConstraintError) {
        throw new AppError("ALREADY_LOANED", "El usuario ya tiene ese libro sin devolver", 409);
      }
      throw err;
    }

    return loanId ? this.getById(loanId) : null;
  }

  // Renueva en UN solo UPDATE condicional: solo si sigue activo y nadie lo renovó en el medio
  // (renovacionesPrevias = lo que leyó el caso de uso). Mira y escribe en un paso: sin condición de carrera.
  async renew(id, { fechaVencimiento, renovacionesPrevias }) {
    const [affected] = await LoanModel.update(
      { fechaVencimiento, renovaciones: literal("renovaciones + 1") },
      { where: { id, fechaDevolucion: null, renovaciones: renovacionesPrevias } }
    );
    return affected === 0 ? null : this.getById(id);
  }

  // Marca la devolución y repone 1 de stock en UNA transacción. Devuelve null si ya estaba devuelto o no existe.
  async giveBack(id, fechaDevolucion) {
    const done = await sequelize.transaction(async (t) => {
      const [affected] = await LoanModel.update(
        { fechaDevolucion },
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
