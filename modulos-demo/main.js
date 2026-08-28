import { sumar, promedio } from "./matematica.js";

console.log("sumar(2, 3) =", sumar(2, 3));
console.log("promedio([2, 4, 6]) =", promedio([2, 4, 6]));

// Diferencias respecto a cómo escribo libroService.js en CommonJS (mínimo dos):
// 1) Acá tuve que poner la extensión completa en la ruta: "./matematica.js".
//    Con require("./libroService") en CommonJS la extensión ".js" es opcional.
// 2) Tuve que agregar "type": "module" en el package.json de esta carpeta para
//    que Node interprete import/export. En biblioteca-api, sin ese campo,
//    Node asume CommonJS por default y ahí uso require/module.exports.
// (Bonus, no pedido pero lo noté: estos imports tienen que ir al nivel superior
// del archivo, no puedo meter un import adentro de un if como sí puedo con require.)
