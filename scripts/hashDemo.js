// scripts/hashDemo.js — Ejercicio 2.2 y 2.3
// Ejecutar con: node scripts/hashDemo.js
import { createPasswordHasher } from "../security/passwordHasher.js";

const password = "MiClaveSegura123";

// ===== Paso 2: misma contraseña, dos hashes =====
const hasher = createPasswordHasher({ rounds: 10 });

const h1 = await hasher.hash(password);
const h2 = await hasher.hash(password);

console.log("hash 1:", h1);
console.log("hash 2:", h2);
console.log("¿son iguales?:", h1 === h2);
console.log("compare con h1:", await hasher.compare(password, h1));
console.log("compare con h2:", await hasher.compare(password, h2));
console.log("compare con clave incorrecta:", await hasher.compare("otraClave", h1));

/*
 * Ej. 2.2 — ¿Por qué los hashes son distintos y aun así compare funciona con los dos?
 * Los hashes son distintos porque bcrypt genera una sal (salt) aleatoria en cada
 * llamada a hash. Esa sal no es secreta: queda guardada dentro del propio hash
 * (después de la versión y los rounds, ej. $2b$10$<sal><hash>). Cuando se llama a
 * compare, bcrypt lee la sal y los rounds de ese hash, vuelve a hashear la contraseña
 * con esa misma sal y compara los resultados. Por eso funciona con los dos.
 */

// ===== Paso 3: tiempo de hash según rounds =====
console.log("\n--- Tiempos ---");
for (const rounds of [4, 10, 14]) {
  const h = createPasswordHasher({ rounds });
  const inicio = performance.now();
  await h.hash(password);
  const fin = performance.now();
  console.log(`rounds=${rounds} -> ${(fin - inicio).toFixed(1)} ms`);
}

/*
 * Ej. 2.3 — ¿Qué observás con los tiempos?
 * A medida que aumentan los rounds, el tiempo crece de forma exponencial: cada +1 round
 * duplica el tiempo, porque bcrypt hace 2^rounds iteraciones.
 * Mis tiempos: rounds 4 ≈ 1,5 ms | rounds 10 ≈ 80 ms | rounds 14 ≈ 1.260 ms (16 veces más que 10).
 * Esa lentitud es intencional: a un usuario que hace login 80 ms no le afectan, pero a un
 * atacante que prueba millones de contraseñas le multiplica el tiempo del ataque.
 * Hay que elegir un valor equilibrado (10-12): seguro, sin volver lento el login.
 */