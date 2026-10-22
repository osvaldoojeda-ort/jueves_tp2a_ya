import AppError from "../errors/AppError.js";

/**
 * Controlador de Usuarios.
 * Recibe los casos de uso por inyección de dependencias; no conoce ningún DAO.
 */
class UsersController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // GET /users (?nombre=&email=&rol=&page=&limit=&incluir=libros&activos=)
  list = async (req, res) => {
    res.json(await this.#useCases.getUsers(req.query));
  };

  // GET /users/:id
  get = async (req, res) => {
    const user = await this.#useCases.getUserById(Number(req.params.id), req.query);
    if (!user) throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
    res.json(user);
  };

  // POST /users
  create = async (req, res) => {
    const user = await this.#useCases.createUser(req.body);
    res.status(201).json(user);
  };

  // PUT /users/:id
  update = async (req, res) => {
    const user = await this.#useCases.updateUser(Number(req.params.id), req.body);
    if (!user) throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
    res.json(user);
  };

  // DELETE /users/:id
  remove = async (req, res) => {
    const deleted = await this.#useCases.deleteUser(Number(req.params.id));
    if (!deleted) throw new AppError("USER_NOT_FOUND", "No existe un usuario con ese id", 404);
    res.status(204).send();
  };
}

export default UsersController;
