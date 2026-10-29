import AppError from "../errors/AppError.js";

/**
 * Controlador de autenticación.
 * El token se devuelve en el body JSON; el front decide dónde guardarlo y lo manda en cada request
 * con el header "Authorization: Bearer <token>".
 */
class AuthController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // POST /auth/register
  register = async (req, res) => {
    const user = await this.#useCases.register(req.body);
    res.status(201).json(user);
  };

  // POST /auth/login
  login = async (req, res) => {
    res.json(await this.#useCases.login(req.body));
  };

  // PUT /auth/password
  changePassword = async (req, res) => {
    await this.#useCases.changePassword(req.user.id, req.body);
    res.status(204).send();
  };

  // GET /auth/me (?incluir=libros&activos=)
  me = async (req, res) => {
    const user = await this.#useCases.getProfile(req.user.id, req.query);
    // El token era válido pero el usuario ya no existe (fue eliminado)
    if (!user) throw new AppError("USER_NOT_FOUND", "El usuario del token ya no existe", 404);
    res.json(user);
  };
}

export default AuthController;
