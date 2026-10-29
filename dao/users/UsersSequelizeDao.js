import { Op } from "sequelize";
import { UserModel } from "../models/index.js";

// Columnas pedidas explícitamente: sin `attributes` Sequelize hace SELECT * y traería TODAS las columnas
// (`passwordHash` saldría en cada respuesta). Todas las lecturas de este DAO la usan.
// El hash solo se lee con getCredentialsByEmail, que existe únicamente para el login.
const USER_ATTRIBUTES = ["id", "nombre", "email", "rol"];

/**
 * Adaptador DAO para Usuarios utilizando Sequelize (SQL).
 * Debe respetar la misma interfaz pública que UsersMemoryDao.
 */
class UsersSequelizeDao {
  // La tabla se crea con sequelize.sync() desde BooksSequelizeDao.init().

  // Los filtros y la paginación los resuelve la BD (WHERE / LIMIT).
  // Op.like es el LIKE de SQL: `%an%` significa "contiene 'an'" (el % es un comodín de cualquier texto).
  // Se importa de Sequelize porque en `where` un objeto { [Op.like]: valor } se traduce a `columna LIKE valor`.
  // filters: { nombre, email, rol, page, limit }
  async getAll({ nombre, email, rol, page = 1, limit } = {}) {
    const where = {};
    if (nombre !== undefined) where.nombre = { [Op.like]: `%${nombre}%` };
    if (email !== undefined) where.email = email;
    if (rol !== undefined) where.rol = rol;

    return UserModel.findAll({
      where,
      attributes: USER_ATTRIBUTES,
      order: [["id", "ASC"]],
      ...(limit && { limit, offset: (page - 1) * limit }),
      raw: true,
    });
  }

  // Un resultado de Sequelize es una instancia del modelo (trae métodos como save/update y datos internos).
  // `.get({ plain: true })` la convierte en un objeto plano de JS: solo { id, nombre, ... } sin métodos,
  // igual al que devuelve el DAO en memoria, y listo para serializar a JSON.
  async getById(id) {
    const user = await UserModel.findByPk(id, { attributes: USER_ATTRIBUTES });
    return user ? user.get({ plain: true }) : null;
  }

  async getByEmail(email) {
    const user = await UserModel.findOne({ where: { email }, attributes: USER_ATTRIBUTES });
    return user ? user.get({ plain: true }) : null;
  }

  // Credenciales para el login: es el ÚNICO método que devuelve el hash de la contraseña
  async getCredentialsByEmail(email) {
    const user = await UserModel.findOne({
      where: { email },
      attributes: [...USER_ATTRIBUTES, "passwordHash"],
    });
    return user ? user.get({ plain: true }) : null;
  }

  async save(data) {
    const { id: _ignored, ...userData } = data;
    const newUser = await UserModel.create(userData);
    // create() devuelve la instancia con todo lo que se insertó: se relee con las columnas permitidas
    return this.getById(newUser.id);
  }

  async update(id, changes) {
    const user = await UserModel.findByPk(id, { attributes: USER_ATTRIBUTES });
    if (!user) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    await user.update(allowedChanges);
    // Se relee con las columnas permitidas: si el cambio incluía passwordHash, la instancia lo trae cargado
    return this.getById(id);
  }

  async delete(id) {
    const deletedCount = await UserModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}

export { UsersSequelizeDao };
export default new UsersSequelizeDao();
