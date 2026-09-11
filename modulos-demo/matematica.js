// matematica.js — ES Modules (habilitado por "type": "module" en package.json)

export function sumar(a, b) {
  return a + b;
}

export function promedio(numeros) {
  if (numeros.length === 0) return 0;
  const suma = numeros.reduce((acc, n) => acc + n, 0);
  return suma / numeros.length;
}
