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

// --- Consumo de APIs externas (Clase 12) ---
const CATALOG_TYPE = process.env.CATALOG_TYPE || "openlibrary"; // "openlibrary" (real) o "fake" (offline, para clase y tests)
const OPEN_LIBRARY_URL = process.env.OPEN_LIBRARY_URL || "https://openlibrary.org";
const EXTERNAL_TIMEOUT_MS = Number(process.env.EXTERNAL_TIMEOUT_MS) || 5000; // tiempo máximo de espera por pedido externo
const IMPORT_CONCURRENCY = Number(process.env.IMPORT_CONCURRENCY) || 3; // pedidos externos simultáneos al importar
const CATALOG_CACHE_TTL_MS = Number(process.env.CATALOG_CACHE_TTL_MS ?? 0); // caché del gateway real en ms (0 = apagada; con caché, la comparación secuencial/paralelo/lote deja de ser honesta)
const EXTERNAL_RETRIES = Number(process.env.EXTERNAL_RETRIES ?? 0); // reintentos ante fallas transitorias (0 = sin reintentos)
const EXTERNAL_RETRY_BASE_MS = Number(process.env.EXTERNAL_RETRY_BASE_MS) || 1000; // espera inicial: se duplica en cada reintento
const FAKE_LATENCY_MS = Number(process.env.FAKE_LATENCY_MS) || 300; // demora simulada por pedido del catálogo fake

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
  CATALOG_TYPE,
  OPEN_LIBRARY_URL,
  EXTERNAL_TIMEOUT_MS,
  IMPORT_CONCURRENCY,
  CATALOG_CACHE_TTL_MS,
  EXTERNAL_RETRIES,
  EXTERNAL_RETRY_BASE_MS,
  FAKE_LATENCY_MS,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};
