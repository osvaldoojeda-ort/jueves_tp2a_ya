import AppError from "../errors/AppError.js";

/**
 * Controlador de Préstamos.
 * Recibe los casos de uso por inyección de dependencias; no conoce ningún DAO.
 */
class LoansController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // GET /loans?userId=&bookId=&activos=
  list = async (req, res) => {
    res.json(await this.#useCases.getLoans(req.query));
  };

  // GET /loans/:id
  get = async (req, res) => {
    const loan = await this.#useCases.getLoanById(Number(req.params.id));
    if (!loan) throw new AppError("LOAN_NOT_FOUND", "No existe un préstamo con ese id", 404);
    res.json(loan);
  };

  // POST /loans
  create = async (req, res) => {
    const loan = await this.#useCases.createLoan(req.body);
    res.status(201).json(loan);
  };

  // PUT /loans/:id/return
  giveBack = async (req, res) => {
    const loan = await this.#useCases.returnLoan(Number(req.params.id));
    res.json(loan);
  };
}

export default LoansController;
