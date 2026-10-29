/**
 * Adaptador DAO en memoria para Usuarios.
 * Respeta la misma interfaz pública que UsersSequelizeDao.
 * Guarda `passwordHash` pero nunca lo devuelve, salvo en getCredentialsByEmail (para el login).
 */
class UsersMemoryDao {
  #users;
  #nextId;

  // El administrador inicial lo siembra el contenedor (necesita hashear su contraseña)
  constructor(initialUsers = []) {
    this.#users = [...initialUsers];
    this.#nextId = this.#users.reduce((max, u) => (u.id > max ? u.id : max), 0) + 1;
  }

  // Copia del usuario sin el hash de la contraseña
  #toPublic({ passwordHash: _hidden, ...user }) {
    return user;
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
    const user = this.#users.find((u) => u.id === Number(id));
    return user ? this.#toPublic(user) : null;
  }

  async getByEmail(email) {
    const user = this.#users.find((u) => u.email === email);
    return user ? this.#toPublic(user) : null;
  }

  // Credenciales para el login: es el ÚNICO método que devuelve el hash de la contraseña
  async getCredentialsByEmail(email) {
    const user = this.#users.find((u) => u.email === email);
    return user ? { ...user } : null;
  }

  async save(data) {
    const { id: _ignored, ...userData } = data;
    const newUser = { id: this.#nextId++, ...userData };
    this.#users.push(newUser);
    return this.#toPublic(newUser);
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
