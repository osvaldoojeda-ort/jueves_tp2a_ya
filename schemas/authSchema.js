import { z } from "zod";
import { createUserSchema, passwordField } from "./userSchema.js";

// POST /auth/register: autoregistro público. No acepta `rol`: quien se registra siempre es "lector".
const registerSchema = createUserSchema.omit({ rol: true });

// POST /auth/login
const loginSchema = z.object({
  email: z.email({ error: "Debe ser un correo electrónico válido" }),
  password: z.string({ error: "La contraseña es obligatoria" }).min(1, "La contraseña es obligatoria"),
});

// PUT /auth/password: exige la contraseña actual además de la nueva
const changePasswordSchema = z.object({
  currentPassword: z.string({ error: "La contraseña actual es obligatoria" }).min(1, "La contraseña actual es obligatoria"),
  newPassword: passwordField,
});

export { registerSchema, loginSchema, changePasswordSchema };
