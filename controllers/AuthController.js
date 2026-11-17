/**
 * Controlador de Autenticación.
 * Recibe los casos de uso de auth por inyección; no conoce DAOs, bcrypt ni JWT.
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
    const result = await this.#useCases.login(req.body); // { token, user }
    res.json(result);
  };

  // GET /auth/me  (req.user lo deja el middleware authenticate)
  me = async (req, res) => {
    const user = await this.#useCases.getProfile(req.user);
    res.json(user);
  };
}

export default AuthController;