# Arquitectura de la API de Biblioteca (Clase 10)

Este documento muestra cómo está armado el cableado del proyecto y cómo funciona la inyección de dependencias, leyendo el código real.

**Recursos que existen hoy:** libros (`/books`), usuarios (`/users`) y préstamos (`/loans`).
**Lo que no existe (todavía):** auth, hasheador de contraseñas y tokens. No hay nada de eso en el código, por eso no aparece en los diagramas.

**Convención de flechas en todos los diagramas:**

- Flecha continua `-->` = **llama** (flujo de ejecución en runtime).
- Flecha punteada `-.->` = **inyecta** (el container le pasa una dependencia a otra pieza al armarla).

> Nota sobre carpetas: en el disco la carpeta es `usecases/` y el `container.js` importa desde `../usecases/...`. En el índice de git figura como `useCases/` (y `booksController.js` en minúscula). En macOS anda igual, pero en Linux (por ejemplo en un deploy) los imports podrían fallar por mayúsculas/minúsculas. En los diagramas uso los nombres tal como los importa el código.

---

## 1. Diagrama general: quién crea qué (Composition Root)

```mermaid
flowchart TB
    subgraph ENTRY["index.js"]
        IDX["startServer()<br/>app.use(logger)<br/>app.use(express.json())<br/>app.use(router)<br/>app.use(notFound)<br/>app.use(errorHandler)"]
    end

    subgraph CFG["config/config.js"]
        ENV["PERSISTENCE_TYPE<br/>NOTIFIER_TYPE<br/>LOW_STOCK_THRESHOLD<br/>PORT"]
    end

    subgraph ROOT["container/container.js — buildContainer()"]
        direction TB
        C1["1. getBooksDao() / getUsersDao() / getLoansDao()<br/>+ await dao.init() si existe"]
        C2["2. createEventBus()<br/>registerAlertListeners(events, getNotifier())"]
        C3["3. makeBookUseCases / makeUserUseCases / makeLoanUseCases"]
        C4["4. new BooksController / UsersController / LoansController"]
        C5["5. createBooksRouter / createUsersRouter / createLoansRouter<br/>router.use('/books' | '/users' | '/loans')"]
        C1 --> C2 --> C3 --> C4 --> C5
    end

    subgraph FACT["Factories de selección"]
        DF["dao/daoFactory.js<br/>getBooksDao · getUsersDao · getLoansDao"]
        NF["notifications/notifierFactory.js<br/>getNotifier()"]
    end

    IDX -->|"await buildContainer()"| ROOT
    ROOT -->|"devuelve el Router"| IDX
    ENV -.->|"PERSISTENCE_TYPE"| DF
    ENV -.->|"NOTIFIER_TYPE"| NF
    C1 -->|"llama"| DF
    C2 -->|"llama"| NF
    ROOT -.->|"inyecta DAOs + events"| UC["use cases (make*UseCases)"]
    UC -.->|"inyectados en el constructor"| CT["Controllers"]
    CT -.->|"inyectado en create*Router"| RT["Routers"]

    classDef inject stroke-dasharray: 5 5;
```

**Cómo se lee:** `index.js` solo arma Express y le pide el router a `buildContainer()`; no conoce ninguna clase concreta. Dentro de `container/container.js` se ve el orden de armado de abajo hacia arriba: primero DAOs (elegidos por `daoFactory.js` según `PERSISTENCE_TYPE`), después el bus y el notificador, luego los casos de uso, los controllers y los routers. Las flechas punteadas son inyecciones: cada capa recibe ya armada a la de abajo.

---

## 2. Flujo de una petición (de punta a punta)

```mermaid
flowchart LR
    CLI(["Cliente HTTP"])

    subgraph EXPRESS["Express (index.js)"]
        LOG["logger<br/>(middlewares/logger.js)"]
        JSON["express.json()"]
    end

    subgraph ROUTER["routes/*Routes.js"]
        VAL["validate / validateQuery / validateParams<br/>(middlewares/validate.js + schemas/*Schema.js)"]
    end

    CTRL["Controller<br/>(BooksController · UsersController · LoansController)"]
    UCASE["Caso de uso<br/>(usecases/&lt;recurso&gt;/*.js)"]
    DAO["DAO<br/>(contrato: getAll · getById · save · ...)"]
    DB[("Memoria (Array JS)<br/>o SQLite vía Sequelize")]

    NF["notFound<br/>(middlewares/notFound.js)"]
    EH["errorHandler<br/>(middlewares/errorHandler.js)"]

    CLI --> LOG --> JSON --> VAL --> CTRL --> UCASE --> DAO --> DB
    DB --> DAO --> UCASE --> CTRL -->|"res.json / res.status(...)"| CLI

    JSON -.->|"ruta inexistente"| NF
    NF -->|"next(AppError 404)"| EH
    VAL -->|"next(AppError VALIDATION_ERROR 400)"| EH
    UCASE -->|"throw AppError"| EH
    EH -->|"{ error: { code, message } }"| CLI
```

**Cómo se lee:** de izquierda a derecha va la petición: pasa por `logger` y `express.json()` (globales en `index.js`), después por el middleware de validación de cada ruta (Zod), y recién ahí llega al método del controller. El controller delega en el caso de uso, que usa el DAO. Los errores (`AppError`) cortan el flujo y van a `errorHandler`, que arma la respuesta JSON. `notFound` atrapa lo que ningún router resolvió.

---

## 3. Contratos: casos de uso → DAO / notificador, y elección por variable de entorno

```mermaid
flowchart TB
    subgraph UCS["Casos de uso (solo conocen el contrato)"]
        UC["createBook(data, dao, events)<br/>createLoan(data, loansDao, booksDao, usersDao, events)<br/>createUser(data, dao, events)"]
    end

    subgraph CONTRATO_DAO["Contrato DAO (no hay clase base: es una interfaz implícita, 'duck typing')"]
        direction LR
        BC["Books: getAll · getById · getByIsbn · save · update · delete"]
        UCN["Users: getAll · getById · getByEmail · save · update · delete"]
        LC["Loans: getAll · getById · getActive · lend · giveBack"]
    end

    subgraph MEM["Implementaciones en memoria"]
        BM["dao/books/BooksMemoryDao.js"]
        UM["dao/users/UsersMemoryDao.js"]
        LM["dao/loans/LoansMemoryDao.js"]
    end

    subgraph SEQ["Implementaciones Sequelize"]
        BS["dao/books/BooksSequelizeDao.js"]
        US["dao/users/UsersSequelizeDao.js"]
        LS["dao/loans/LoansSequelizeDao.js"]
    end

    DFX{{"dao/daoFactory.js<br/>PERSISTENCE_TYPE === 'sequelize' ?"}}
    ENVV[/"PERSISTENCE_TYPE<br/>(config/config.js, default 'memory')"/]

    subgraph CONTRATO_N["Contrato Notificador"]
        NC["notify({ subject, body })"]
    end
    CN["notifications/consoleNotifier.js"]
    FN["notifications/fileNotifier.js"]
    NFX{{"notifications/notifierFactory.js<br/>NOTIFIER_TYPE === 'file' ?"}}
    ENVN[/"NOTIFIER_TYPE<br/>(default 'console')"/]

    UC -->|"usa"| CONTRATO_DAO
    BM -. "implementa" .-> BC
    BS -. "implementa" .-> BC
    UM -. "implementa" .-> UCN
    US -. "implementa" .-> UCN
    LM -. "implementa" .-> LC
    LS -. "implementa" .-> LC

    ENVV -.-> DFX
    DFX -->|"'memory'"| MEM
    DFX -->|"'sequelize'"| SEQ

    ENVN -.-> NFX
    NFX -->|"'console'"| CN
    NFX -->|"'file'"| FN
    CN -. "implementa" .-> NC
    FN -. "implementa" .-> NC
```

**Cómo se lee:** los casos de uso reciben el DAO por parámetro y solo llaman a métodos del contrato, nunca importan `BooksMemoryDao` ni `BooksSequelizeDao`. Quien decide la implementación es `dao/daoFactory.js`, mirando `PERSISTENCE_TYPE` (por defecto `"memory"`). El notificador funciona igual: `notifierFactory.js` elige `consoleNotifier` o `fileNotifier` según `NOTIFIER_TYPE`, y ambos respetan `notify({ subject, body })`. Los contratos no están declarados en código (no hay interfaz ni clase base): son una convención que se mantiene a mano.

> Ojo con un detalle: `LoansMemoryDao` **no** recibe sus DAOs por inyección desde el container. Su constructor tiene como valores por defecto los singletons `booksMemoryDao` y `usersMemoryDao` importados directamente. Funciona porque el container usa esos mismos singletons, pero es un acoplamiento oculto. Además, el contrato de libros tiene un método extra, `adjustStock`, que solo implementa `BooksMemoryDao` y lo usa `LoansMemoryDao` (la versión Sequelize hace el ajuste de stock dentro de su propia transacción en `LoansSequelizeDao.lend` / `giveBack`).

---

## 4. Eventos: emisor, bus y listeners

```mermaid
flowchart LR
    subgraph EMIT["Emisores (casos de uso)"]
        E1["usecases/books/createBook.js"]
        E2["usecases/books/updateBook.js"]
        E3["usecases/loans/createLoan.js"]
        E4["usecases/users/createUser.js"]
    end

    BUS(("events<br/>createEventBus()<br/>(EventEmitter)"))
    NAMES["events/eventNames.js<br/>EVENTS.BOOK_LOW_STOCK = 'book.lowStock'<br/>EVENTS.USER_CREATED = 'user.created'"]

    subgraph LIS["alerts/registerAlertListeners.js"]
        L1["bus.on(BOOK_LOW_STOCK) → notify({ subject: 'Stock bajo', ... })"]
        L2["bus.on(USER_CREATED) → notify({ subject: 'Bienvenida', ... })"]
    end

    NOT["notifier (contrato notify)<br/>consoleNotifier | fileNotifier"]
    CONT["container.js<br/>buildContainer()"]

    E1 -->|"events.emit(BOOK_LOW_STOCK)<br/>si stock ≤ LOW_STOCK_THRESHOLD"| BUS
    E2 -->|"events.emit(BOOK_LOW_STOCK)"| BUS
    E3 -->|"events.emit(BOOK_LOW_STOCK)"| BUS
    E4 -->|"events.emit(USER_CREATED)"| BUS
    BUS -->|"dispara"| L1
    BUS -->|"dispara"| L2
    L1 -->|"notifier.notify(...)"| NOT
    L2 -->|"notifier.notify(...)"| NOT

    CONT -.->|"inyecta events (via make*UseCases)"| EMIT
    CONT -.->|"inyecta events + getNotifier()"| LIS
    NAMES -. "nombres compartidos" .-> EMIT
    NAMES -. "nombres compartidos" .-> LIS
```

**Cómo se lee:** hay un único bus (`createEventBus()` devuelve un `EventEmitter` de Node) creado en `buildContainer()` e inyectado tanto a los casos de uso (emisores) como a `registerAlertListeners` (oyente). Los emisores no saben quién escucha, y los listeners no saben quién emite; solo comparten los nombres de `events/eventNames.js`. Los listeners tienen `try/catch`, así que si falla la notificación no se rompe el caso de uso que emitió el evento.

---

## 5. Cadena completa por recurso

### 5.1 Libros (`/books`)

```mermaid
flowchart LR
    R["routes/booksRoutes.js<br/>createBooksRouter(controller)<br/>validate · validateQuery · validateParams<br/>(schemas/bookSchema.js)"]
    C["controllers/BooksController.js<br/>class BooksController<br/>list · get · create · update · remove"]
    F["usecases/books/makeBookUseCases.js<br/>makeBookUseCases(dao, loansDao, events)"]
    U["getBooks · getBookById · createBook<br/>updateBook · deleteBook"]
    D1[("booksDao<br/>BooksMemoryDao | BooksSequelizeDao")]
    D2[("loansDao<br/>LoansMemoryDao | LoansSequelizeDao")]
    EV(("events"))

    R -->|"controller.list / get / create / update / remove"| C
    C -->|"this.#useCases.xxx()"| U
    U -->|"dao.xxx()"| D1
    U -->|"loansDao.getAll()<br/>(incluir, activos, borrado)"| D2
    U -->|"events.emit(BOOK_LOW_STOCK)<br/>(createBook, updateBook)"| EV

    F -.->|"inyecta dao, loansDao, events en cada función"| U
    C -.->|"recibe el objeto de makeBookUseCases"| F
    R -.->|"recibe el controller"| C
```

**Cómo se lee:** el router de libros recibe el `BooksController` ya armado; el controller recibe el objeto que devuelve `makeBookUseCases(booksDao, loansDao, events)`. Cada función del objeto es un closure que ya tiene el DAO enganchado, por eso el controller llama `getBooks(req.query)` sin pasar el DAO. `loansDao` se usa para incluir préstamos en las consultas y para impedir borrar un libro con préstamos (`deleteBook`).

### 5.2 Usuarios (`/users`)

```mermaid
flowchart LR
    R["routes/usersRoutes.js<br/>createUsersRouter(controller)<br/>validate · validateQuery · validateParams<br/>(schemas/userSchema.js)"]
    C["controllers/UsersController.js<br/>class UsersController<br/>list · get · create · update · remove"]
    F["usecases/users/makeUserUseCases.js<br/>makeUserUseCases(dao, loansDao, events)"]
    U["getUsers · getUserById · createUser<br/>updateUser · deleteUser"]
    D1[("usersDao<br/>UsersMemoryDao | UsersSequelizeDao")]
    D2[("loansDao<br/>LoansMemoryDao | LoansSequelizeDao")]
    EV(("events"))

    R -->|"controller.list / get / create / update / remove"| C
    C -->|"this.#useCases.xxx()"| U
    U -->|"dao.xxx()<br/>(getByEmail para validar duplicados)"| D1
    U -->|"loansDao.getAll()<br/>(incluir, activos, borrado)"| D2
    U -->|"events.emit(USER_CREATED)<br/>(createUser)"| EV

    F -.->|"inyecta dao, loansDao, events"| U
    C -.->|"recibe el objeto de makeUserUseCases"| F
    R -.->|"recibe el controller"| C
```

**Cómo se lee:** misma forma que libros. `createUser` valida el email con `dao.getByEmail`, guarda con `dao.save` y emite `USER_CREATED`. `updateUser` solo usa `dao` (no recibe `loansDao` ni `events`, aunque `makeUserUseCases` los tiene a mano). `deleteUser` consulta `loansDao` para no borrar usuarios con préstamos.

### 5.3 Préstamos (`/loans`)

```mermaid
flowchart LR
    R["routes/loansRoutes.js<br/>createLoansRouter(controller)<br/>validate · validateQuery · validateParams<br/>(schemas/loanSchema.js)"]
    C["controllers/LoansController.js<br/>class LoansController<br/>list · get · create · giveBack"]
    F["usecases/loans/makeLoanUseCases.js<br/>makeLoanUseCases({ loansDao, booksDao, usersDao, events })"]
    U["getLoans · getLoanById<br/>createLoan · returnLoan"]
    DL[("loansDao<br/>getAll · getById · getActive · lend · giveBack")]
    DB[("booksDao<br/>getById")]
    DU[("usersDao<br/>getById")]
    EV(("events"))

    R -->|"controller.list / get / create / giveBack"| C
    C -->|"this.#useCases.xxx()"| U
    U -->|"loansDao.xxx()"| DL
    U -->|"createLoan: booksDao.getById()"| DB
    U -->|"createLoan: usersDao.getById()"| DU
    U -->|"events.emit(BOOK_LOW_STOCK)<br/>(createLoan)"| EV

    F -.->|"inyecta loansDao, booksDao, usersDao, events"| U
    C -.->|"recibe el objeto de makeLoanUseCases"| F
    R -.->|"recibe el controller"| C
```

**Cómo se lee:** es el recurso con más dependencias. `makeLoanUseCases` recibe un único objeto con los tres DAOs y el bus (a diferencia de libros y usuarios, que usan parámetros posicionales). `createLoan` valida que existan el usuario y el libro, chequea que no tenga ya ese préstamo activo (`getActive`), presta con `loansDao.lend` (descuenta stock) y emite `BOOK_LOW_STOCK` si el stock quedó bajo. `returnLoan` solo usa `loansDao` (`getById` y `giveBack`, que repone el stock).

### 5.4 Auth

No existe en este proyecto: no hay router, controller, caso de uso, hasheador de contraseñas ni servicio de tokens. Cuando se agregue, el lugar natural es el mismo patrón: un `make*UseCases` que reciba el DAO y los servicios (hasheador, tokens) desde `container/container.js`.

---

## 6. Modelos Sequelize (solo si `PERSISTENCE_TYPE=sequelize`)

```mermaid
flowchart LR
    CONN["connection/sequelize.js<br/>new Sequelize({ dialect: 'sqlite' })"]
    IDX["connection/index.js<br/>export { sequelize }"]
    MOD["dao/models/index.js<br/>asociaciones + export de modelos"]
    BM["BookModel.js"]
    UM["UserModel.js"]
    LM["LoanModel.js<br/>(tabla intermedia)"]
    DAOS["BooksSequelizeDao · UsersSequelizeDao · LoansSequelizeDao"]
    INIT["BooksSequelizeDao.init()<br/>sequelize.sync()<br/>(llamado desde buildContainer)"]

    CONN --> IDX --> MOD
    MOD --- BM
    MOD --- UM
    MOD --- LM
    UM <-->|"belongsToMany (through Loan)"| BM
    LM -->|"belongsTo usuario / libro"| UM
    LM -->|"belongsTo"| BM
    DAOS -->|"importan modelos"| MOD
    INIT -->|"crea las tablas de los 3 modelos"| CONN
```

**Cómo se lee:** la conexión se crea una sola vez en `connection/sequelize.js` y se reexporta desde `connection/index.js`. `dao/models/index.js` define las relaciones (usuarios y libros N a N a través de préstamos) y es lo único que importan los DAOs Sequelize. Las tres tablas se crean con un único `sequelize.sync()` que corre en `BooksSequelizeDao.init()`, por eso `buildContainer()` llama a ese `init()` primero.

---

(si tu editor no renderiza Mermaid, instalá la extensión "Markdown Preview Mermaid Support" en VSCode, o mirá el archivo directamente en GitHub)
