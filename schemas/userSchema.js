import { z } from "zod";

// Crear usuario
export const createUserSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  rol: z.enum(["lector", "admin"]).optional().default("lector"),
});

// Actualizar usuario: todo opcional
export const updateUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rol: z.enum(["lector", "admin"]).optional(),
});

// Validar el :id de la URL
export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
