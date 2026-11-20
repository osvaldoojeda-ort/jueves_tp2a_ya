import { operation, ref, arrayOf, json } from "../operation.js";
import { createLoanSchema, queryLoansSchema, loanIdParamSchema } from "../../schemas/loanSchema.js";

const tag = "Préstamos";

// Las reglas de negocio de la Clase 13, contadas para quien consume la API (no para quien la programó)
const RULES = [
  "Reglas:",
  "- **R1:** como máximo 3 préstamos activos por usuario (`LOAN_LIMIT_REACHED`).",
  "- **R2:** vence a los 10 días hábiles (sin sábados, domingos ni feriados). Si la API de feriados no responde, " +
    "se presta igual sin descontarlos y la respuesta trae `holidaysAvailable: false`.",
  "- **R3:** con algún préstamo vencido no se puede pedir otro (`USER_HAS_OVERDUE_LOANS`; los vencidos van en `details`).",
  "",
  "Los números (3 y 10) son la configuración por defecto: cada instalación puede cambiarlos.",
].join("\n");

export default {
  "/loans": {
    get: operation({
      tag,
      id: "listLoans",
      summary: "Listar préstamos",
      description: "Un lector ve solo los suyos; el admin ve todos. Cada préstamo trae su `estado` calculado.",
      auth: "user",
      query: queryLoansSchema,
      responses: { 200: json("Préstamos que cumplen los filtros", arrayOf(ref("Loan"))) },
      errors: ["FORBIDDEN"],
    }),
    post: operation({
      tag,
      id: "createLoan",
      summary: "Pedir un libro prestado",
      description: `Un lector pide a su nombre; el admin puede indicar \`userId\`.\n\n${RULES}`,
      auth: "user",
      body: createLoanSchema,
      bodyExample: { bookId: 1 },
      responses: {
        201: json("Préstamo creado", ref("Loan"), {
          headers: { Location: { description: "URL del préstamo creado", schema: { type: "string", examples: ["/loans/7"] } } },
        }),
      },
      errors: [
        "FORBIDDEN",
        "USER_NOT_FOUND",
        "BOOK_NOT_FOUND",
        "ALREADY_LOANED",
        "USER_HAS_OVERDUE_LOANS",
        "LOAN_LIMIT_REACHED",
        "OUT_OF_STOCK",
      ],
    }),
  },

  "/loans/{id}": {
    get: operation({
      tag,
      id: "getLoan",
      summary: "Obtener un préstamo",
      auth: "user",
      params: loanIdParamSchema,
      responses: { 200: json("El préstamo", ref("Loan")) },
      errors: ["FORBIDDEN", "LOAN_NOT_FOUND"],
    }),
  },

  "/loans/{id}/return": {
    put: operation({
      tag,
      id: "returnLoan",
      summary: "Devolver un libro",
      description: "Repone 1 de stock. Un lector solo devuelve los suyos.",
      auth: "user",
      params: loanIdParamSchema,
      responses: { 200: json("Préstamo devuelto", ref("Loan")) },
      errors: ["LOAN_NOT_FOUND", "FORBIDDEN", "ALREADY_RETURNED"],
    }),
  },

  "/loans/{id}/renew": {
    put: operation({
      tag,
      id: "renewLoan",
      summary: "Renovar un préstamo",
      description:
        "**R4:** se renueva una sola vez, si no está vencido ni devuelto. " +
        "El nuevo vencimiento se cuenta desde el vencimiento actual (renovar antes no hace perder días).",
      auth: "user",
      params: loanIdParamSchema,
      responses: { 200: json("Préstamo renovado", ref("Loan")) },
      errors: ["LOAN_NOT_FOUND", "FORBIDDEN", "ALREADY_RETURNED", "LOAN_OVERDUE", "RENEWAL_LIMIT_REACHED", "LOAN_CHANGED"],
    }),
  },
};
