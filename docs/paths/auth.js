import { operation, ref, json } from "../operation.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../../schemas/authSchema.js";
import { queryUserByIdSchema } from "../../schemas/userSchema.js";

const tag = "Autenticación";

export default {
  "/auth/register": {
    post: operation({
      tag,
      id: "register",
      summary: "Registrarse",
      description: "Quien se registra siempre queda con rol `lector` (el campo `rol` no se acepta).",
      body: registerSchema,
      bodyExample: { nombre: "Ana Pérez", email: "ana@mail.com", password: "Secreta123" },
      responses: { 201: json("Usuario creado (sin la contraseña)", ref("User")) },
      errors: ["EMAIL_DUPLICATED"],
    }),
  },

  "/auth/login": {
    post: operation({
      tag,
      id: "login",
      summary: "Iniciar sesión",
      description:
        "Devuelve un JWT. En Swagger UI: copiá el `token`, tocá **Authorize** y pegalo (sin la palabra Bearer). " +
        "El error es el mismo si el email no existe o si la contraseña es incorrecta. " +
        "Hay un límite de intentos **fallidos** por IP y por minuto.",
      body: loginSchema,
      bodyExample: { email: "admin@biblioteca.com", password: "Admin1234" },
      responses: {
        200: json("Sesión iniciada", ref("LoginResponse"), {
          headers: {
            RateLimit: { description: "Intentos fallidos restantes en la ventana actual (draft-7)", schema: { type: "string" } },
          },
        }),
      },
      errors: ["INVALID_CREDENTIALS", "TOO_MANY_ATTEMPTS"],
    }),
  },

  "/auth/password": {
    put: operation({
      tag,
      id: "changePassword",
      summary: "Cambiar la contraseña propia",
      auth: "user",
      body: changePasswordSchema,
      bodyExample: { currentPassword: "Secreta123", newPassword: "OtraSecreta456" },
      responses: { 204: { description: "Contraseña cambiada (sin cuerpo)" } },
      errors: ["INVALID_CREDENTIALS", "USER_NOT_FOUND"],
    }),
  },

  "/auth/me": {
    get: operation({
      tag,
      id: "me",
      summary: "Mi perfil",
      description: "El usuario dueño del token. Con `incluir=libros`, los libros que tiene o tuvo.",
      auth: "user",
      query: queryUserByIdSchema,
      responses: { 200: json("Mi usuario", ref("UserWithBooks")) },
      errors: ["USER_NOT_FOUND"],
    }),
  },
};
