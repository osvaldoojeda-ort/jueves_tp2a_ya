// concepts.js
import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

// 1. Encoding: base64 se revierte con una línea, no hay secreto
const encoded = Buffer.from("hola").toString("base64");
const decoded = Buffer.from(encoded, "base64").toString();
console.log("encoding:", encoded, "→", decoded); // aG9sYQ== → hola

// 2. Hash: mismo input, mismo output, y no hay forma de volver. Solo se puede VERIFICAR.
const sha = (text) => createHash("sha256").update(text).digest("hex");
const stored = sha("hola");
console.log("hash:", stored);
console.log("¿'hola' coincide?", sha("hola") === stored);   // true
console.log("¿'Hola' coincide?", sha("Hola") === stored);   // false: cambiar una letra cambia todo el hash

// 3. Encriptación: con la clave se recupera el original (es reversible a propósito)
const key = randomBytes(32);
const iv = randomBytes(16);
const cipher = createCipheriv("aes-256-cbc", key, iv);
const encrypted = cipher.update("hola", "utf8", "hex") + cipher.final("hex");
console.log("encriptado:", encrypted);

const decipher = createDecipheriv("aes-256-cbc", key, iv);
const recovered = decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
console.log("desencriptado con la clave:", recovered); // hola

// Con otra clave NO se puede recuperar
try {
  const wrong = createDecipheriv("aes-256-cbc", randomBytes(32), iv);
  const garbage = wrong.update(encrypted, "hex", "utf8") + wrong.final("utf8");
  console.log("con otra clave: basura, no el original →", JSON.stringify(garbage));
} catch {
  console.log("con otra clave: error, no se recupera");
}

// 4. Firma (HMAC): el texto queda visible, pero no se puede alterar sin la clave
const sign = (text, secret) => createHmac("sha256", secret).update(text).digest("hex");
const verify = (text, signature, secret) => {
  const expected = Buffer.from(sign(text, secret));
  const received = Buffer.from(signature);
  // timingSafeEqual compara en tiempo constante (no revela cuántos caracteres coinciden)
  return expected.length === received.length && timingSafeEqual(expected, received);
};

const signature = sign("hola", "mi-secreto");
console.log("firma:", signature);
console.log("¿válida?", verify("hola", signature, "mi-secreto"));            // true
console.log("¿texto alterado?", verify("hola!", signature, "mi-secreto"));   // false
console.log("¿otro secreto?", verify("hola", signature, "secreto-falso"));   // false
