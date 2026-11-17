/**
 * Módulo centralizado de configuración de la aplicación.
 * Lee las variables de entorno desde process.env (cargadas vía --env-file)
 * y exporta constantes fuertemente tipadas y con valores por defecto.
 */

// NUEVO: lee una variable obligatoria; si falta o está vacía, corta el arranque.
function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`[config] Falta la variable de entorno ${name}. Revisá tu .env`);
  }
  return value;
}

const PORT = Number(process.env.PORT) || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const PERSISTENCE_TYPE = process.env.PERSISTENCE_TYPE || "memory"; // "memory" o "sequelize"

const NOTIFIER_TYPE = process.env.NOTIFIER_TYPE || "console"; // "console" o "file"
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? 2); // alerta si stock <= umbral

// NUEVO — Seguridad (Clase 11)
const JWT_SECRET = required("JWT_SECRET"); // sin valor por defecto
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/*
 * Ej. 1.5 — ¿Por qué es peligroso que el secreto tenga un valor por defecto "para desarrollo"?
 * Es peligroso porque el valor por defecto queda escrito en el código, a la vista de
 * cualquiera que vea el repositorio. Si en producción se olvidan de configurar la
 * variable, la app funciona igual y nadie se da cuenta. Con el secreto, un atacante
 * puede firmar sus propios tokens con rol: "admin", y la API los acepta como válidos.
 * Por eso es mejor que la app no arranque si falta el secreto, así el error se detecta enseguida.
 */

export {
  PORT,
  NODE_ENV,
  PERSISTENCE_TYPE,
  NOTIFIER_TYPE,
  LOW_STOCK_THRESHOLD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_ROUNDS,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};