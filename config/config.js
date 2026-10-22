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

export { PORT, NODE_ENV, PERSISTENCE_TYPE, NOTIFIER_TYPE, LOW_STOCK_THRESHOLD };

