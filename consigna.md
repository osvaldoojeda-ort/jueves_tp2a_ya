# Clase 3 — Consigna de práctica

Seguimos en la carpeta `biblioteca-api/` de las clases 1 y 2.

## Ejercicio 1 — De array hardcodeado a archivo JSON

1. Crear `data/libros.json` con el mismo array de libros que tenían en `data/libros.js` (mínimo 5 libros), pegado como JSON válido (sin `module.exports`, solo el array).
2. En `libroService.js`, reemplazar el `require("./data/libros")` por lectura desde el archivo, usando `fs/promises`:
   - `async function listarLibros()`: lee `data/libros.json`, hace `JSON.parse` y devuelve el array.
   - Las demás funciones de la clase 1 (`buscarPorId`, `buscarPorAutor`, `contarConStock`) ahora también van a ser `async`, porque internamente llaman a `listarLibros()`.
3. Agregar una función nueva `async function agregarLibro(libro)` que:
   - Lea el archivo actual.
   - Le agregue el libro nuevo (con un `id` que sea `Math.max(...ids) + 1`, o `1` si está vacío).
   - Escriba el array completo de vuelta al archivo con `fs.writeFile` (usando `JSON.stringify(libros, null, 2)` para que quede legible).
   - Devuelva el libro creado.
4. Actualizar `index.js`: como ahora todas las funciones son `async`, hay que llamarlas con `await` dentro de una función `async` (o encadenadas con `.then`). Probar `listarLibros()`, `agregarLibro(...)` con un libro nuevo, y volver a `listarLibros()` para confirmar que quedó guardado — **incluso si vuelven a correr el script**, el libro nuevo tiene que seguir estando (a diferencia de la clase 1, donde vivía solo en memoria).

## Ejercicio 2 — CommonJS vs ES Modules (comparación aislada)

Este ejercicio es aparte del proyecto integrador — es solo para practicar la sintaxis de ESM con la mano.

1. Crear una carpeta `modulos-demo/` con `"type": "module"` en su propio `package.json` (`npm init -y` adentro y después agregar el campo a mano).
2. Adentro, crear `matematica.js` que exporte (con `export`) dos funciones: `sumar(a, b)` y `promedio(numeros)`.
3. Crear `main.js` que las importe con `import` (recordar la extensión `.js` en la ruta) y las pruebe con un par de `console.log`.
4. Correrlo con `node main.js`. Anotar en un comentario, en una línea: ¿qué tuvieron que cambiar respecto a cómo escriben `libroService.js` en CommonJS? (mínimo dos diferencias).

## Ejercicio 3 — Servidor HTTP puro

1. Crear `servidor-http/index.js` (carpeta nueva, aparte de `biblioteca-api/` — es solo para practicar el módulo `http` antes de Express).
2. Levantar un servidor con `http.createServer` que responda:
   - `GET /` → status 200, `{ "mensaje": "Biblioteca API" }`.
   - `GET /libros` → status 200, y el array completo de libros (pueden requerir `../biblioteca-api/data/libros.json` o copiar el archivo acá, lo que les resulte más simple).
   - Cualquier otra ruta o método → status 404, `{ "error": "Ruta no encontrada" }`.
3. Loggear en consola, por cada request que llega, el método y la url (`req.method`, `req.url`).
4. Probarlo desde el navegador (`http://localhost:3000/` y `http://localhost:3000/libros`) y con la extensión REST Client (crear `servidor-http/pruebas.http` con al menos 3 requests: las dos rutas válidas y una ruta inexistente).

### Desafío opcional — leer el body de un POST a mano

Agregar una ruta `POST /eco` que lea el body crudo del request (escuchando los eventos `data` y `end` del stream `req`, acumulando los chunks, y haciendo `JSON.parse` al final) y lo devuelva tal cual en la respuesta. No hace falta que persista nada — es solo para sentir, una vez, lo que Express nos va a ahorrar de acá en más.

## Entregable

- `biblioteca-api/data/libros.json` + `libroService.js` actualizado a `fs/promises`, corriendo sin errores y persistiendo entre corridas.
- Carpeta `modulos-demo/` con `matematica.js` + `main.js` en ES Modules.
- Carpeta `servidor-http/` con `index.js` y `pruebas.http`, sirviendo las 3 rutas pedidas.