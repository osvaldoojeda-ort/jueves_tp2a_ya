// scripts/showUsers.js — Ej. 9.4: ver qué se guarda en la tabla users
// Ejecutar desde la RAÍZ del proyecto con: node scripts/showUsers.js
import { sequelize } from "../connection/index.js";

const [rows] = await sequelize.query("SELECT id, nombre, email, rol, passwordHash FROM users");
console.table(rows);

await sequelize.close();
