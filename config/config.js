/**
 * Módulo centralizado de configuración de la aplicación.
 * Lee las variables de entorno desde process.env (cargadas vía --env-file)
 * y exporta constantes fuertemente tipadas y con valores por defecto.
 */
const PORT = Number(process.env.PORT) || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const PERSISTENCE_TYPE = process.env.PERSISTENCE_TYPE || "memory"; // "memory" o "sequelize"

const NOTIFIER_TYPE = process.env.NOTIFIER_TYPE || "console"; // "console" o "file"
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? 2); // alerta si stock <= umbral

// --- Seguridad (Clase 11) ---
// El secreto firma los tokens: si alguien lo conoce, puede fabricar tokens válidos. Sin valor por defecto a propósito.
// ¿Por qué es peligroso un valor por defecto "para desarrollo"? Porque el código es público (git): si el default
// es "secret123" y alguien despliega sin definir la variable, TODOS pueden fabricar un token de admin, y la app
// funciona igual, así que nadie se entera. Es mejor que falle ruidosamente al arrancar.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Falta la variable de entorno JWT_SECRET (copiá .env.example a .env y completala)");
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"; // vida del token ("15m", "1h", "7d")
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10; // costo del hash: cada +1 duplica el tiempo

// Máximo de intentos de login FALLIDOS por IP y por minuto (los exitosos no cuentan)
const LOGIN_RATE_LIMIT_MAX = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5;

// Administrador inicial (se siembra al arrancar si no existe). Sin ADMIN_PASSWORD no se siembra.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@biblioteca.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export {
  PORT,
  NODE_ENV,
  PERSISTENCE_TYPE,
  NOTIFIER_TYPE,
  LOW_STOCK_THRESHOLD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_ROUNDS,
  LOGIN_RATE_LIMIT_MAX,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};
