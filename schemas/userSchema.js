import { z } from "zod";

const ROLES = ["lector", "admin"];

const fields = {
  nombre: z.string({ error: "El nombre es obligatorio" }).min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email({ error: "Debe ser un correo electrónico válido" }),
  rol: z.enum(ROLES, { error: "El rol debe ser 'lector' o 'admin'" }),
};

// Esquema para POST /users
const createUserSchema = z.object({
  nombre: fields.nombre,
  email: fields.email,
  rol: fields.rol.default("lector"),
});

// Esquema para PUT /users/:id (actualización parcial)
const updateUserSchema = z.object({
  nombre: fields.nombre.optional(),
  email: fields.email.optional(),
  rol: fields.rol.optional(),
});

// Esquema para validar los parámetros de la URL (ej: /users/:id)
const userIdParamSchema = z.object({
  id: z.coerce.number().int("El ID debe ser un número entero").positive("El ID debe ser un número positivo"),
});

export { createUserSchema, updateUserSchema, userIdParamSchema };
