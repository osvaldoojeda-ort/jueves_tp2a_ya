import AppError from "../../errors/AppError.js";

/**
 * Caso de Uso: Iniciar sesión.
 * Compara la contraseña recibida contra el hash guardado y, si coincide, firma un token JWT.
 * El error es el MISMO si el email no existe o si la contraseña es incorrecta: así nadie puede
 * usar el login para averiguar qué emails están registrados.
 * Además, si el email no existe igual se ejecuta bcrypt contra un hash falso: sin eso la respuesta sería
 * mucho más rápida y cronometrándola se distinguiría "email inexistente" de "contraseña incorrecta".
 */
async function loginUser({ email, password }, dao, hasher, tokens, dummyHash) {
  const credentials = await dao.getCredentialsByEmail(email);
  const hashToCompare = credentials?.passwordHash ?? (await dummyHash);
  const matches = await hasher.compare(password, hashToCompare);
  const valid = credentials && matches;
  if (!valid) {
    throw new AppError("INVALID_CREDENTIALS", "Email o contraseña incorrectos", 401);
  }

  // En el payload va lo mínimo (no es secreto: cualquiera puede leerlo). `sub` = quién es el dueño del token.
  const token = tokens.sign({ sub: String(credentials.id), rol: credentials.rol });

  return {
    token,
    user: { id: credentials.id, nombre: credentials.nombre, email: credentials.email, rol: credentials.rol },
  };
}

export default loginUser;
