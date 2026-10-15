# Taller de Programación 2 — Temario

## Objetivo general

Al finalizar el curso, cada alumno debe poder construir una API RESTful con Node.js + Express, separada en capas (router/controller → casos de uso → DAO/repository → adaptador de persistencia), con autenticación JWT, validación de datos, manejo de errores estandarizado y capacidad de consumir APIs externas — listos para rendir un final tipo "sensores IoT" (arquitectura hexagonal-lite) o tipo "hotel" (CRUD + JWT + CSV).

## Proyecto integrador

Un único proyecto crece clase a clase a lo largo del curso. Se define el dominio concreto (ej: sistema de monitoreo, reservas, etc.) en la clase 1 junto con el grupo. Cada clase deja una consigna que se suma al proyecto anterior — para la clase 16 el proyecto ya cubre: CRUD completo, arquitectura en capas con DAO intercambiable, eventos internos, JWT, consumo de API externa con generación de CSV, testing de casos de uso y documentación.

## Stack

Node.js, Express, Sequelize (SQL), JWT, Zod, Jest/Vitest, Swagger/OpenAPI. Sin TypeScript ni DI containers (se enseña inyección de dependencias manual vía factories).

## Formato de cada clase

4hs reloj: **2hs de teoría** + **2hs de práctica guiada**. Cada clase tiene su propio `material-teorico.md` y `consigna.md` en `clases/NN_clase/`.

## Programa

| #  | Bloque            | Teoría                                                                                     | Práctica                                                                                   |
| -- | ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1  | Fundamentos       | Setup Node/npm/terminal, JS moderno relámpago (const/let, arrow fn, destructuring, spread) | Mini-scripts en terminal,`npm init`, primer script async con `fetch` a una API pública |
| 2  | Fundamentos       | Asincronismo: callbacks → promesas → async/await, manejo de errores                       | Refactor a async/await; consumo de endpoints en serie y en paralelo (`Promise.all`)       |
| 3  | Fundamentos       | Módulos (require/import),`fs` sync/async, servidor HTTP puro (sin Express)               | Leer/escribir JSON a archivo — siembra del futuro DAO en archivo                           |
| 4  | Express y REST    | Express: routing, middlewares, req/res, body parsing                                        | CRUD in-memory todo en un archivo (sin capas, a propósito)                                 |
| 5  | Express y REST    | Diseño REST: verbos, status codes, query params, formato de error estandarizado            | Refactor a`routes/` y `controllers/`                                                    |
| 6  | Express y REST    | Validación (Zod) + manejo de errores centralizado                                          | Validaciones + error handler en el proyecto integrador                                      |
| 7  | Arquitectura      | Por qué separar en capas: casos de uso, DAO como puerto, inversión de dependencias        | Extraer casos de uso del controller                                                         |
| 8  | Arquitectura      | DAO/Repository pattern + Factories (inyección de dependencias manual)                      | DAO en memoria + factory que arma el caso de uso                                            |
| 9  | Arquitectura      | Persistencia intercambiable: Sequelize como segundo adaptador, seleccionable por env var    | Correr el proyecto con dos backends de persistencia sin tocar casos de uso                  |
| 10 | Arquitectura      | Eventos:`EventEmitter` para desacoplar regla de negocio de efecto secundario              | Módulo de alertas → notificación disparado por evento                                    |
| 11 | Seguridad         | JWT: login, firma, expiración, middleware de auth reutilizable                             | Proteger endpoints de escritura                                                             |
| 12 | Consumo externo   | Fetch secuencial/paralelo a APIs externas, transformación de datos                         | Generar CSV descargable a partir de una API pública                                        |
| 13 | Reglas de negocio | Validaciones cruzadas y reglas finas, repaso de status codes                                | Aplicar sobre el proyecto integrador +`.http` de pruebas                                  |
| 14 | Calidad           | Testing de casos de uso con Jest/Vitest (sin infra)                                         | Tests unitarios sobre 2-3 casos de uso                                                      |
| 15 | Calidad           | Swagger/OpenAPI, README profesional, checklist de buenas prácticas                         | Documentar el proyecto + colección Postman/REST Client                                     |
| 16 | Cierre            | —                                                                                          | Simulacro de examen con enunciado nuevo, tiempo acotado, feedback individual                |


## Evaluación

A definir con el resto de la cátedra. Referencias usadas para calibrar el nivel de exigencia: final estilo "sensores IoT" (arquitectura hexagonal-lite, DAO en memoria) y final estilo "hotel" (Anderson Ocaña — Mongo/JSON intercambiable, JWT, consumo de API externa + CSV).