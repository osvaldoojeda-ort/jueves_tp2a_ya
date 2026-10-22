/**
 * Adaptador DAO en memoria para Usuarios.
 * Respeta la misma interfaz pública que UsersSequelizeDao.
 */
class UsersMemoryDao {
  #users;
  #nextId;

  constructor(initialUsers = [{ id: 1, nombre: "Admin", email: "admin@biblioteca.com", rol: "admin" }]) {
    this.#users = [...initialUsers];
    this.#nextId = this.#users.reduce((max, u) => (u.id > max ? u.id : max), 0) + 1;
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

    return users.map((u) => ({ ...u }));
  }

  async getById(id) {
    return this.#users.find((u) => u.id === Number(id)) ?? null;
  }

  async getByEmail(email) {
    return this.#users.find((u) => u.email === email) ?? null;
  }

  async save(data) {
    const { id: _ignored, ...userData } = data;
    const newUser = { id: this.#nextId++, ...userData };
    this.#users.push(newUser);
    return newUser;
  }

  async update(id, changes) {
    const index = this.#users.findIndex((u) => u.id === Number(id));
    if (index === -1) return null;

    const { id: _ignored, ...allowedChanges } = changes;
    this.#users[index] = { ...this.#users[index], ...allowedChanges };
    return this.#users[index];
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
