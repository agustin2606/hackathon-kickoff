---
name: demo-script
description: Levanta ChargeHood (local o la URL pública de Railway), siembra datos de demo, camina el flujo completo con Playwright CLI y entrega un script concreto de demo para mostrar a los jueces — un happy path, un caso borde y un caso que debe fallar, con datos literales, nunca inventados. Correr cerca del final del día, antes del polish, para tener margen de arreglar si algo falla. Usar cuando el usuario diga "armemos el demo", "preparemos qué mostrar a los jueces", "probemos el flujo completo", "/demo-script".
---

# demo-script — la app funciona Y es la app correcta

Los criterios del hackathon incluyen "Demo: funcionamiento correcto del prototipo" y "disponible
públicamente al momento de la evaluación". Esta skill entrega la evidencia de ambas cosas: prueba
que el flujo corre de punta a punta, y entrega el guion literal para presentarlo — nada de improvisar
frente a los jueces con datos que nunca se probaron.

El entregable es el **script**, no la app corriendo. Levantar la app y no dejar un guion concreto es
dejarle el trabajo a quien presenta.

## 1. Levantar el stack

Preferir la URL pública de Railway si ya está deployada y actualizada — es lo que van a ver los
jueces, así que es lo que hay que probar. Si todavía no hay redeploy con los últimos cambios de
integración, levantar local:

Un solo servicio, una sola URL — Express sirve la API y el build de React (ver
`scaffold-monorepo`). Local:

```bash
npm run build > /tmp/demo-build.log 2>&1; echo EXIT=$?   # build del client → server/public
grep -iE 'error' /tmp/demo-build.log | tail -20
npm start &                                              # :3000, API + app
sleep 4 && curl -s http://localhost:3000/api/health
```

Probar **el build de producción, no el dev server con hot-reload** — es lo que van a ver los jueces.
Esperar el `{"status":"ok"}` antes de seguir, y confirmar la URL final (Railway o local) antes del
paso 3.

## 2. Sembrar datos de demo

Si no existe ya un seed, crearlo ahora como parte de esta skill (no queda en el spec ni en el
scaffold — es dato de demo, no de negocio): 2-3 vecinos con nombre real y vehículo, algunos horarios
del cargador ya reservados y otros libres, al menos una sesión de carga con consumo registrado para
que el historial y el estado de cuenta tengan algo que mostrar. Usar nombres y valores concretos
(no "Usuario 1", sí "Ana Gómez"), porque van a aparecer en pantalla frente a los jueces.

## 3. Caminar el flujo una vez, en un browser real — Playwright CLI

Cada paso del script que se va a entregar tiene que haberse ejecutado de verdad acá, no derivado del
código a ojo. Usar la CLI de Playwright (`playwright-cli`, instalar global si no está:
`npm install -g @playwright/cli@latest`), un comando por paso:

```bash
playwright-cli open <url>
playwright-cli snapshot                 # refs de los elementos: e1, e2, ...
playwright-cli click e3                 # elegir vecino de la lista (login simulado)
playwright-cli snapshot
playwright-cli fill e7 "12/09 10:00"    # ejemplo: reservar un horario
playwright-cli click e9
playwright-cli snapshot                 # confirmar que el horario reservado desaparece de disponibles
playwright-cli screenshot --filename=./demo-assets/demo-step-1.png
playwright-cli close
```

`snapshot` antes que `screenshot` — más barato y confirma el cambio de estado; usar `screenshot` solo
cuando lo que hay que juzgar es visual (el diseño, no el dato). Los refs son por-snapshot: volver a
snapshotear después de cualquier acción que re-renderice.

Un paso que falla acá se reporta al equipo para que lo arreglen — no se edita el script para que
"pase". El caso que debe fallar (ver abajo) es la única excepción: ese *tiene* que fallar.

## 4. Armar el script — 3 pasos, 3 formas

- **Happy path**: el flujo principal completo (elegir vecino → ver disponibilidad → reservar →
  "escanear" QR → registrar consumo → ver costo calculado en el estado de cuenta).
- **Edge case**: algo no trivial pero válido (ej. reservar el último horario libre del día, o un
  vecino con dos vehículos eligiendo cuál carga).
- **Debe fallar**: algo que el sistema tiene que rechazar (ej. reservar un horario ya ocupado por
  otro vecino → 409, y la UI lo muestra en vez de romperse).

Cada paso: acción concreta con datos literales + resultado esperado concreto (no "funciona
correctamente" — sí "el horario 10:00-11:00 deja de aparecer en la lista de disponibles y pasa a
'Ocupado por Ana Gómez'").

## 5. Entregar

Formato fijo, corto, va directo en el mensaje al equipo:

```
URL: https://chargehood-production.up.railway.app

1. Elegir "Ana Gómez" de la lista de vecinos (login simulado).
   Esperado: entra al dashboard, ve el cargador con horarios libres y ocupados.
2. Reservar el horario 10:00-11:00 de hoy.
   Esperado: el horario pasa a "Reservado por Ana Gómez", desaparece de disponibles para otros vecinos.
3. "Escanear" el QR de Ana Gómez al llegar al cargador → registrar 8.5 kWh consumidos.
   Esperado: la sesión queda en el historial de Ana con el consumo y el costo calculado.
4. (edge) Intentar reservar el mismo horario 10:00-11:00 desde otro vecino ("Juan Pérez").
   Esperado: rechaza con "horario ya reservado", no crea una segunda reserva.
5. Ver el dashboard del edificio.
   Esperado: muestra consumo total del período y el costo que corresponde pagar a cada vecino.
```

## 6. No aprobar el propio demo

Terminar el mensaje pidiendo que alguien del equipo lo camine una vez más en persona antes de la
presentación — esta skill prueba que el flujo corre, no reemplaza el ensayo humano de cómo se
cuenta la historia frente a los jueces.
