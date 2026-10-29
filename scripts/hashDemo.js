// scripts/hashDemo.js — Ejercicio 2 de la consigna: node scripts/hashDemo.js
import bcrypt from "bcryptjs";

const password = "Clave12345";

// 1. La misma contraseña hasheada dos veces
const hashA = await bcrypt.hash(password, 10);
const hashB = await bcrypt.hash(password, 10);
console.log("hash A:", hashA);
console.log("hash B:", hashB);
console.log("¿son iguales?", hashA === hashB);

// ¿Por qué son distintos y aun así compare funciona con los dos?
// bcrypt genera un salt ALEATORIO en cada hash() y lo guarda dentro del propio resultado
// ($2b$10$ + 22 caracteres de salt + hash). compare() lee el salt del hash guardado, vuelve a hashear la
// contraseña con ESE salt y compara. Por eso no hace falta una columna "salt" aparte.
console.log("compare con A:", await bcrypt.compare(password, hashA));
console.log("compare con B:", await bcrypt.compare(password, hashB));
console.log("compare con otra contraseña:", await bcrypt.compare("otra-clave", hashA));

// 2. Cuánto tarda hash() según el costo (rounds)
// Cada +1 de costo DUPLICA el tiempo: 4 → 10 son 64 veces más lento, 10 → 14 otras 16 veces.
// Es lento a propósito: para el login es imperceptible, para un atacante que prueba millones de
// contraseñas es lo que lo hace inviable.
for (const rounds of [4, 10, 14]) {
  const start = performance.now();
  await bcrypt.hash(password, rounds);
  console.log(`rounds ${String(rounds).padStart(2)}: ${(performance.now() - start).toFixed(0)} ms`);
}
