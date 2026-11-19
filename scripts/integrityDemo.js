// scripts/integrityDemo.js — Ejercicio 6 de la consigna: node scripts/integrityDemo.js
// Prueba la "última línea de defensa" directamente contra los DAOs (sin pasar por el caso de uso):
//   6.3 el índice único parcial existe en database.sqlite
//   6.5 dos lend() EN PARALELO con el mismo usuario y libro: uno se crea, el otro falla con ALREADY_LOANED
//       y el stock baja UNA sola vez (Sequelize y memoria)
//   6.4 un libro devuelto se puede volver a pedir (el índice es parcial)
// IMPORTANTE: pará el servidor antes de correrlo (usa el mismo database.sqlite).
// Este script NO es un caso de uso: puede llamar a new Date() sin problema.
import { sequelize, BookModel, UserModel } from "../dao/models/index.js";
import loansSequelizeDao from "../dao/loans/LoansSequelizeDao.js";
import { LoansMemoryDao } from "../dao/loans/LoansMemoryDao.js";
import booksMemoryDao from "../dao/books/BooksMemoryDao.js";

const FECHA_VENCIMIENTO = "2026-12-04";

function mostrar(resultados) {
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`  Pedido ${i + 1}: ${r.value ? `creado (préstamo id ${r.value.id})` : "null (sin stock)"}`);
    } else {
      console.log(`  Pedido ${i + 1}: rechazado → ${r.reason.code ?? r.reason.name} (${r.reason.statusCode ?? "-"})`);
    }
  });
}

async function conSequelize() {
  console.log("== Sequelize (SQLite) ==");
  await sequelize.sync();

  // 6.3: el índice tiene que estar en sqlite_master con su WHERE
  const [indices] = await sequelize.query(
    "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'loans' AND sql IS NOT NULL"
  );
  console.log("6.3 Índices de la tabla loans:");
  indices.forEach((i) => console.log("  ", i.sql));
  if (!indices.some((i) => /UNIQUE/i.test(i.sql) && /WHERE/i.test(i.sql) && /fechaDevolucion/i.test(i.sql))) {
    console.log("  ⚠ No aparece el índice único parcial: borrá database.sqlite y volvé a arrancar el servidor.");
  }

  // Datos propios para no depender de lo que haya en la base
  const marca = Date.now();
  const user = await UserModel.create({ nombre: "Carrera", email: `carrera${marca}@mail.com`, rol: "lector", passwordHash: "x" });
  const book = await BookModel.create({ titulo: `Libro carrera ${marca}`, autor: "Test", stock: 5 });

  // 6.5: dos pedidos simultáneos, sin pasar por el caso de uso
  console.log(`6.5 Dos lend() en paralelo (usuario ${user.id}, libro ${book.id}, stock inicial 5):`);
  const datos = { userId: user.id, bookId: book.id, fechaPrestamo: new Date(), fechaVencimiento: FECHA_VENCIMIENTO };
  const resultados = await Promise.allSettled([loansSequelizeDao.lend(datos), loansSequelizeDao.lend(datos)]);
  mostrar(resultados);
  const stock = (await BookModel.findByPk(book.id)).stock;
  console.log(`  Stock final: ${stock} (esperado 4: bajó una sola vez)`);

  // 6.4: se devuelve y se vuelve a pedir
  const creado = resultados.find((r) => r.status === "fulfilled" && r.value)?.value;
  await loansSequelizeDao.giveBack(creado.id, new Date());
  const otraVez = await loansSequelizeDao.lend({ ...datos, fechaPrestamo: new Date() });
  console.log(`6.4 Devuelto y pedido de nuevo: ${otraVez ? `creado (préstamo id ${otraVez.id})` : "null"} (el índice es parcial)`);
}

async function enMemoria() {
  console.log("\n== Memoria ==");
  const loansDao = new LoansMemoryDao();
  const [book] = await booksMemoryDao.getAll();
  const stockInicial = book.stock;
  const datos = { userId: 999, bookId: book.id, fechaPrestamo: new Date(), fechaVencimiento: FECHA_VENCIMIENTO };
  console.log(`6.5 Dos lend() en paralelo (libro ${book.id}, stock inicial ${stockInicial}):`);
  const resultados = await Promise.allSettled([loansDao.lend(datos), loansDao.lend(datos)]);
  mostrar(resultados);
  console.log(`  Stock final: ${(await booksMemoryDao.getById(book.id)).stock} (esperado ${stockInicial - 1})`);
}

try {
  await conSequelize();
  await enMemoria();
} finally {
  await sequelize.close();
}