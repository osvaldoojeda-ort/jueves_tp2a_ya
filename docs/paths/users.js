import { operation, ref, arrayOf, json } from "../operation.js";
import {
  createUserSchema,
  updateUserSchema,
  queryUsersSchema,
  queryUserByIdSchema,
  userIdParamSchema,
} from "../../schemas/userSchema.js";

const tag = "Usuarios";

export default {
  "/users": {
    get: operation({
      tag,
      id: "listUsers",
      summary: "Listar usuarios",
      auth: "admin",
      query: queryUsersSchema,
      responses: { 200: json("Usuarios que cumplen los filtros", arrayOf(ref("UserWithBooks"))) },
    }),
    post: operation({
      tag,
      id: "createUser",
      summary: "Crear un usuario",
      description: "A diferencia de `POST /auth/register`, acá el admin puede elegir el rol.",
      auth: "admin",
      body: createUserSchema,
      bodyExample: { nombre: "Ana Pérez", email: "ana@mail.com", password: "Secreta123", rol: "lector" },
      responses: { 201: json("Usuario creado (sin la contraseña)", ref("User")) },
      errors: ["EMAIL_DUPLICATED"],
    }),
  },

  "/users/{id}": {
    get: operation({
      tag,
      id: "getUser",
      summary: "Obtener un usuario",
      auth: "admin",
      params: userIdParamSchema,
      query: queryUserByIdSchema,
      responses: { 200: json("El usuario", ref("UserWithBooks")) },
      errors: ["USER_NOT_FOUND"],
    }),
    put: operation({
      tag,
      id: "updateUser",
      summary: "Actualizar un usuario (parcial)",
      auth: "admin",
      params: userIdParamSchema,
      body: updateUserSchema,
      bodyExample: { nombre: "Ana María Pérez" },
      responses: { 200: json("Usuario actualizado", ref("User")) },
      errors: ["USER_NOT_FOUND", "EMAIL_DUPLICATED"],
    }),
    delete: operation({
      tag,
      id: "deleteUser",
      summary: "Eliminar un usuario",
      auth: "admin",
      params: userIdParamSchema,
      responses: { 204: { description: "Eliminado (sin cuerpo)" } },
      errors: ["USER_NOT_FOUND", "USER_HAS_LOANS"],
    }),
  },
};
