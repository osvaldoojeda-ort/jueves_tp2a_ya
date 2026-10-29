import { z } from "zod";
import { activosSchema } from "./loanSchema.js";

const ROLES = ["lector", "admin"];

const fields = {
  nombre: z.string({ error: "El nombre es obligatorio" }).min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email({ error: "Debe ser un correo electrónico válido" }),
  // Reglas mínimas de contraseña; bcrypt solo procesa los primeros 72 bytes, por eso el máximo
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar los 72 caracteres"),
  rol: z.enum(ROLES, { error: "El rol debe ser 'lector' o 'admin'" }),
};

const passwordField = fields.password;

// Esquema para POST /users
const createUserSchema = z.object({
  nombre: fields.nombre,
  email: fields.email,
  password: fields.password,
  rol: fields.rol.default("lector"),
});

// Esquema para PUT /users/:id (actualización parcial)
const updateUserSchema = z.object({
  nombre: fields.nombre.optional(),
  email: fields.email.optional(),
  password: fields.password.optional(),
  rol: fields.rol.optional(),
});

// Esquema para req.query en GET /users (filtros, paginación y relación con libros)
const queryUsersSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().optional(),
  rol: fields.rol.optional(),
  incluir: z.enum(["libros"], { error: "incluir solo admite 'libros'" }).optional(),
  activos: activosSchema.optional(), // solo aplica junto con incluir=libros
  page: z.coerce.number().int("La página debe ser un entero").positive("La página debe ser mayor a 0").optional(),
  limit: z.coerce.number().int("El límite debe ser un entero").positive("El límite debe ser mayor a 0").max(100, "El límite máximo es 100").optional(),
});

// Esquema para req.query en GET /users/:id
const queryUserByIdSchema = z.object({
  incluir: z.enum(["libros"], { error: "incluir solo admite 'libros'" }).optional(),
  activos: activosSchema.optional(),
});

// Esquema para validar los parámetros de la URL (ej: /users/:id)
const userIdParamSchema = z.object({
  id: z.coerce.number().int("El ID debe ser un número entero").positive("El ID debe ser un número positivo"),
});

export { passwordField, createUserSchema, updateUserSchema, queryUsersSchema, queryUserByIdSchema, userIdParamSchema };
