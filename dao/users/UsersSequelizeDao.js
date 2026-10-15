import { UserModel } from "../models/index.js";

/**
 * Adaptador DAO para Usuarios utilizando Sequelize (SQL).
 * Debe respetar la misma interfaz pública que UsersMemoryDao.
 */
class UsersSequelizeDao {
  // La tabla se crea con sequelize.sync() desde BooksSequelizeDao.init(); acá solo sembramos datos.
  

  async getAll() {
    return await UserModel.findAll({ raw: true });
  }

  async getById(id) {
    const user = await UserModel.findByPk(id);
    return user ? user.get({ plain: true }) : null;
  }

  async getByEmail(email) {
    const user = await UserModel.findOne({ where: { email } });
    return user ? user.get({ plain: true }) : null;
  }

  async save(data) {
    const { id: _ignored, ...userData } = data;
    const newUser = await UserModel.create(userData);
    return newUser.get({ plain: true });
  }

  async update(id, changes) {
    const user = await UserModel.findByPk(id);
    if (!user) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    await user.update(allowedChanges);
    return user.get({ plain: true });
  }

  async delete(id) {
    const deletedCount = await UserModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}

export { UsersSequelizeDao };
export default new UsersSequelizeDao();
