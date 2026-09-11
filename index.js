const verify = require("./verify.js");
const http = require("node:http");
// console.log(`🚀 ~ http:`, http)
// console.log(require)

//  console.log(verify(true))

// verify(true)
//   .then((data) => data+" lolo")
//   .then((data2) => console.log(data2))
//   .catch((error) => console.log(error))
//   .finally(() => {
//     console.log("termino");
//   });

// async function queOnda() {
//   try {
//     setTimeout(async () => {
//       const data = await verify(true);
//       const data2 = data + " lolo";
//       console.log(`🚀 ~ queOnda ~ data:`, data);
//       console.log(`🚀 ~ queOnda ~ data2:`, data2);
//       return data2;
//     }, 1000);
//   } catch (error) {
//     console.log(error);
//   } finally {
//     console.log("termino");
//   }
// }

// queOnda();

// async function sumar(n1, n2) {
//      return n1+n2
// }

// let resultado=sumar(2,3)
// console.log(`🚀 ~ resultado:`, resultado)
// -----------------------------

const server = http.createServer((request, response) => {
  const url = request.url;
  if (url == "/") {
    response.end("server ok");
  } else if (url == "/saludo") {
    response.end("hola");
  } else {
    response.end("nada");
  }
});
// console.log(`🚀 ~ server:`, server)

server.listen(8000, () => {
  console.log(`🚀 ~ server ok in port:`, 8000);
});

console.log(2 === "2");
