/**
 * Adaptador DAO en memoria para Usuarios.
 * Respeta la misma interfaz pública que UsersSequelizeDao.
 */
class UsersMemoryDao {
  #users;
  #nextId;

  constructor(initialUsers = []) {
    this.#users = [...initialUsers];
    this.#nextId = this.#users.reduce((max, u) => (u.id > max ? u.id : max), 0) + 1;
  }

  // Devuelve una COPIA sin passwordHash. Equivale al `attributes` de Sequelize.
  #toPublic(user) {
    if (!user) return null;
    const { passwordHash: _omit, ...publicData } = user;
    return publicData;
  }

  // filters: { nombre, email, rol, page, limit }
  async getAll({ nombre, email, rol, page = 1, limit } = {}) {
    let users = this.#users.filter(
      (u) =>
        (nombre === undefined || u.nombre.toLowerCase().includes(nombre.toLowerCase())) &&
        (email === undefined || u.email === email) &&
        (rol === undefined || u.rol === rol)
    );

    if (limit) users = users.slice((page - 1) * limit, page * limit);

    return users.map((u) => this.#toPublic(u));
  }

  async getById(id) {
    return this.#toPublic(this.#users.find((u) => u.id === Number(id)));  }

  async getByEmail(email) {    
    return this.#toPublic(this.#users.find((u) => u.email === email));
  }

  async save(data) {
    const { id: _ignored, ...userData } = data;
    const newUser = { id: this.#nextId++, ...userData };
    this.#users.push(newUser);
    return this.#toPublic(newUser);
  }

    async getCredentialsByEmail(email) {
    const user = this.#users.find((u) => u.email === email);
    return user ? { ...user } : null;
  }

  async update(id, changes) {
    const index = this.#users.findIndex((u) => u.id === Number(id));
    if (index === -1) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    this.#users[index] = { ...this.#users[index], ...allowedChanges };
    return this.#toPublic(this.#users[index]);
  }

  async delete(id) {
    const index = this.#users.findIndex((u) => u.id === Number(id));
    if (index === -1) return false;

    this.#users.splice(index, 1);
    return true;
  }
}

export { UsersMemoryDao };
export default new UsersMemoryDao();
