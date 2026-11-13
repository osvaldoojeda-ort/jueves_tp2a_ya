import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersMemoryDao } from "../../../dao/users/UsersMemoryDao.js";
import loginUser from "../../../usecases/auth/loginUser.js";

/**
 * loginUser depende de bcrypt (lento a propósito) y de jsonwebtoken (necesita un secreto).
 * Ninguno de los dos es lo que queremos probar: reemplazamos el hasher y el servicio de tokens por STUBS
 * con el mismo contrato (hash/compare y sign). El test corre en milisegundos y sin JWT_SECRET.
 * Lo que SÍ probamos es la regla: mismo error si el email no existe o si la contraseña es incorrecta.
 */

let dao;
let hasher;
let tokens;
const dummyHash = Promise.resolve("hash:dummy");

beforeEach(() => {
  // Un "hash" falso y transparente: hash:<contraseña>
  hasher = {
    hash: vi.fn(async (plain) => `hash:${plain}`),
    compare: vi.fn(async (plain, hash) => hash === `hash:${plain}`),
  };
  tokens = { sign: vi.fn(() => "token-de-prueba") };
  dao = new UsersMemoryDao([
    { id: 7, nombre: "Ana", email: "ana@test.com", rol: "lector", passwordHash: "hash:Secreta123" },
  ]);
});

describe("loginUser", () => {
  it("con credenciales correctas devuelve el token y el usuario, sin el hash", async () => {
    const result = await loginUser({ email: "ana@test.com", password: "Secreta123" }, dao, hasher, tokens, dummyHash);

    expect(result).toEqual({
      token: "token-de-prueba",
      user: { id: 7, nombre: "Ana", email: "ana@test.com", rol: "lector" },
    });
  });

  it("firma el token con lo mínimo: sub (como texto) y rol", async () => {
    await loginUser({ email: "ana@test.com", password: "Secreta123" }, dao, hasher, tokens, dummyHash);

    expect(tokens.sign).toHaveBeenCalledWith({ sub: "7", rol: "lector" });
  });

  it("contraseña incorrecta → 401 INVALID_CREDENTIALS y no firma ningún token", async () => {
    await expect(
      loginUser({ email: "ana@test.com", password: "otra" }, dao, hasher, tokens, dummyHash)
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", statusCode: 401 });

    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it("email inexistente → EXACTAMENTE el mismo error que una contraseña incorrecta", async () => {
    const errorPassword = await loginUser({ email: "ana@test.com", password: "otra" }, dao, hasher, tokens, dummyHash)
      .catch((err) => err);
    const errorEmail = await loginUser({ email: "nadie@test.com", password: "otra" }, dao, hasher, tokens, dummyHash)
      .catch((err) => err);

    expect(errorEmail.code).toBe(errorPassword.code);
    expect(errorEmail.message).toBe(errorPassword.message);
    expect(errorEmail.statusCode).toBe(errorPassword.statusCode);
  });

  it("aunque el email no exista, igual compara contra el hash falso (para no delatarse por el tiempo)", async () => {
    await loginUser({ email: "nadie@test.com", password: "otra" }, dao, hasher, tokens, dummyHash).catch(() => {});

    expect(hasher.compare).toHaveBeenCalledWith("otra", "hash:dummy");
  });
});
