import { z } from "zod";
import { createUserSchema } from "./userSchema.js";

// Registro público: igual que crear usuario, pero SIN rol.
const registerSchema = createUserSchema.omit({ rol: true });

// Login: solo se pide que vengan. Sin min/max: no se crea nada, solo se compara.
const loginSchema = z.object({
  email: z.email({ error: "Debe ser un correo electrónico válido" }),
  password: z.string({ error: "La contraseña es obligatoria" }).min(1, "La contraseña es obligatoria"),
});

// ← NUEVO (Ej. 10.3) PUT /auth/password
// La actual solo se compara (como en el login). La nueva usa las MISMAS reglas que al crear
// un usuario (min 8, max 72): se reutiliza el campo del schema de usuarios.
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "La contraseña actual es obligatoria" })
      .min(1, "La contraseña actual es obligatoria"),
    newPassword: createUserSchema.shape.password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    error: "La contraseña nueva debe ser distinta de la actual",
    path: ["newPassword"],
  });

export { registerSchema, loginSchema, changePasswordSchema };