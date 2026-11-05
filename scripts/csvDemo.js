// scripts/csvDemo.js — Ejercicio 6.7 de la consigna: node scripts/csvDemo.js
import { toCsv } from "../utils/csv.js";

const rows = [
  { titulo: 'Hola, "mundo"', autor: "línea 1\nlínea 2", stock: -5 },
  { titulo: '=HYPERLINK("http://sitio-malo.com","clic")', autor: "+cmd", stock: null },
  { titulo: "@SUMA(1+1)", autor: "Normal", stock: 0 },
];
const columns = [
  { header: "titulo", value: (r) => r.titulo },
  { header: "autor", value: (r) => r.autor },
  { header: "stock", value: (r) => r.stock },
];

// JSON.stringify muestra los caracteres invisibles (BOM, \r\n) tal cual viajan
console.log("separador ',':", JSON.stringify(toCsv(rows, columns)));
console.log("separador ';':", JSON.stringify(toCsv(rows, columns, { separator: ";" })));

// Qué se espera ver:
//  - 'Hola, "mundo"' queda entre comillas y con las comillas duplicadas.
//  - El salto de línea queda dentro de la celda entre comillas.
//  - '=HYPERLINK(...)', '+cmd' y '@SUMA(...)' empiezan con un apóstrofe: Excel los trata como texto, no como fórmula.
//  - El número -5 NO se toca (es un number, no un texto).
//  - Con ';' una celda con coma ya no necesita comillas, pero una con ';' sí.
