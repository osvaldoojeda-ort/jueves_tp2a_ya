import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Iniciar sesión.
 * Busca las credenciales por email, compara la contraseña con el hash guardado
 * y, si coincide, devuelve un token JWT y los datos públicos del usuario.
 */
async function loginUser({ email, password }, dao, hasher, tokens) {
  // 1) El único lugar de la app que pide el hash
  const credentials = await dao.getCredentialsByEmail(email);

  // 2) Email inexistente o contraseña incorrecta -> el MISMO error
  if (!credentials) {
    throw new AppError("INVALID_CREDENTIALS", "Email o contraseña incorrectos", 401);
  }

  const ok = await hasher.compare(password, credentials.passwordHash);
  if (!ok) {
    throw new AppError("INVALID_CREDENTIALS", "Email o contraseña incorrectos", 401);
  }

  // 3) Payload mínimo: solo sub (id como string) y rol
  const token = tokens.sign({ sub: String(credentials.id), rol: credentials.rol });

  // Se saca el hash antes de devolver el usuario
  const { passwordHash: _omit, ...user } = credentials;
  return { token, user };
}

/*
 * Ej. 5.4 — ¿Por qué el mismo error si el email no existe o la contraseña no coincide?
 * Para que un atacante no pueda usar el login para descubrir qué emails están registrados
 * (enumeración de usuarios). Si las respuestas fueran distintas, probando emails sabría
 * cuáles existen y después atacaría solo esas cuentas (fuerza bruta, phishing).
 * Con el mismo código, status y mensaje, la respuesta no revela nada.
 * (El tiempo de respuesta también puede delatarlo; eso se resuelve en el Ej. 10.1.)
 */

export default loginUser;