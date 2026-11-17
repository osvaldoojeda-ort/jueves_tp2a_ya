import { z } from "zod";
import { createUserSchema } from "./userSchema.js";

// Registro público: igual que crear usuario, pero SIN rol.
// .omit() arma un schema nuevo sacando ese campo. Si el cliente manda "rol",
// Zod lo descarta (por defecto z.object ignora las claves que no conoce).
const registerSchema = createUserSchema.omit({ rol: true });

// Login: solo se pide que vengan. Sin min/max: no se crea nada, solo se compara.
const loginSchema = z.object({
  email: z.email({ error: "Debe ser un correo electrónico válido" }),
  password: z.string({ error: "La contraseña es obligatoria" }).min(1, "La contraseña es obligatoria"),
});

export { registerSchema, loginSchema };