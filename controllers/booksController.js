class BooksController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  list = async (req, res, next) => {
    try {
      const books = await this.#useCases.getBooks(req.query);
      res.status(200).json(books);
    } catch (err) {
      next(err);
    }
  };

  get = async (req, res, next) => {
    try {
      const book = await this.#useCases.getBookById(req.params.id);
      res.status(200).json(book);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const book = await this.#useCases.createBook(req.body);
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const book = await this.#useCases.updateBook(req.params.id, req.body);
      res.status(200).json(book);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.#useCases.deleteBook(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

export default BooksController;
