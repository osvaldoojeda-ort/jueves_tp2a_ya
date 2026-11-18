# NOTAS

## Ejercicio 1.5 — Inspección del package.json

- ¿Qué versión de Express se instaló? En mi caso, `npm install express` instaló la versión **5.2.1** (npm siempre baja la última versión estable disponible en el momento de instalar, así que si vos lo corrés en otro momento puede que te toque una versión distinta — 5.x más nueva, o incluso todavía la rama 4.x si tu profesor pide fijar esa versión a propósito).
- ¿Con qué símbolo quedó anotada y qué significa? Quedó como `"express": "^5.2.1"`, con el símbolo **`^` (caret)**. Significa que npm puede actualizar automáticamente a cualquier versión más nueva que sea **compatible hacia atrás** dentro del mismo número mayor (major) — o sea, cualquier `5.x.x` con `x >= 2` (por ejemplo `5.3.0` o `5.2.5`), pero NUNCA salta solo a `6.0.0`, porque un cambio de versión mayor puede traer breaking changes. (Si en cambio dijera `~5.2.1`, solo permitiría actualizar el número de parche, o sea `5.2.x`, sin tocar el minor.)

## Desafío opcional — PATCH vs PUT e idempotencia

Una operación es **idempotente** cuando hacerla una vez o repetirla varias veces seguidas produce siempre el mismo resultado final (el estado del recurso no cambia por repetir la llamada).

- **PUT es idempotente**: reemplaza el objeto entero con lo que mandes en el body. Si mandás el mismo PUT tres veces seguidas, el libro termina exactamente igual las tres veces — no importa cuántas veces lo repitas, el resultado final es el mismo.
- **PATCH NO es idempotente en general**: depende de qué mandes. Si el body trae un valor fijo (ej: `{ "stock": 8 }`), repetirlo sí da el mismo resultado siempre, y ahí sí sería idempotente. Pero si el body describe un cambio relativo — algo como "restale 1 al stock actual" (`{ "stock": libro.stock - 1 }` calculado del lado del cliente, o un endpoint que hiciera `stock: stock - 1` del lado del servidor) — cada llamada sucesiva sigue restando, así que el resultado final SÍ depende de cuántas veces lo llamaste. Por eso, como PATCH está pensado en general para poder expresar ese tipo de actualizaciones parciales/incrementales, la especificación de HTTP no lo garantiza idempotente, mientras que PUT (reemplazo completo y absoluto) sí lo garantiza siempre.
