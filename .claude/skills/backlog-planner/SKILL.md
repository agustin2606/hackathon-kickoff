---
name: backlog-planner
description: Genera el backlog de ChargeHood a partir de specs/ ya aprobado, partido en 3 lanes paralelas (Backend Core, Backend Billing/Sessions, Frontend) con dependencias explícitas entre tickets, como BACKLOG.md e issues de GitHub. Correr justo después de que el spec esté aprobado y antes de cualquier scaffold o código. Usar cuando el usuario diga "armemos el backlog", "generá los tickets", "partamos el trabajo en lanes", "/backlog-planner".
---

# backlog-planner — backlog paralelizable

Requiere que `specs/PRD.md`, `specs/api-contract.md` y `specs/data-model.md` ya existan y estén
aprobados — si no existen, decir que hay que correr `sdd-spec` primero y parar ahí, no inventar un
backlog sin spec (rompe SDD).

## Objetivo

Convertir el spec en tickets chicos (una sesión de trabajo, no más de ~45-60 min cada uno) repartidos
en las 3 lanes fijas del proyecto, con las dependencias mínimas necesarias para que cada lane pueda
arrancar y avanzar sin esperar a las otras más que lo imprescindible.

Lanes (fijas, ver `CLAUDE.md`):

- **Lane A — Backend Core**: vecinos/vehículos, disponibilidad del cargador, reservas.
- **Lane B — Backend Billing/Sessions**: login QR simulado, registro de consumo, cálculo de costo,
  estado de cuenta, dashboard/agregación.
- **Lane C — Frontend**: pantallas, contra `specs/api-contract.md`.

## Regla de oro: el ticket #1 de Lane A y de Lane B son los stubs

Antes que cualquier ticket de lógica real, **cada lane de backend entrega todos sus endpoints del
contrato como stubs**: la ruta existe, responde el status correcto y devuelve data hardcodeada con
el shape exacto de `specs/api-contract.md`. Sin base de datos, sin validación, sin lógica. Es ~20
minutos de trabajo por lane y se mergea en la primera hora.

Por qué esto es lo primero, siempre:

- **Lane C nunca usa mocks.** Llama a la API real desde su primer ticket y la data se vuelve real
  sola, a medida que A y B reemplazan cada stub por la implementación. Sin capa de mocks que
  mantener, sin divergencia entre el mock y la respuesta real.
- **La fase de integración deja de ser un riesgo.** Pasa de "conectar 9 pantallas al backend en 30
  minutos y rezar" a "revisar lo que quedó" — porque todo estuvo conectado desde la hora 1.
- **Un shape mal entendido aparece a la hora 1, no a la hora 5**, cuando todavía se arregla barato.

Estos dos tickets no tienen dependencias y bloquean a todo lo demás: van primeros en `BACKLOG.md` y
se dicen en voz alta cuando están mergeados.

## Resto de las dependencias — minimizar bloqueos

Con los stubs arriba, Lane C **no depende de nadie**: cada pantalla se construye contra el endpoint
real (stub o implementado, le da igual, el shape es el mismo).

Dependencias reales a marcar:

- Dentro de Lane A/B: un ticket que necesita una tabla creada por otro ticket de la misma lane
  (ej. "reservas" depende de "vecinos/vehículos" si la reserva referencia un vehicleId).
- Entre A y B: solo si B necesita leer una tabla que A crea (ej. "cálculo de costo" puede necesitar
  la tabla de reservas de A). Marcar explícito, minimizar — si se puede, que cada lane tenga su
  propio set de tablas y se junten recién en dashboard/agregación.
- Un ticket de integración final (frontend↔backend real) depende de que las 3 lanes tengan su MVP
  de endpoints/pantallas listos — ese ticket no es de ninguna lane, es del bloque de integración del
  runbook.

Un ticket sin dependencias declaradas se asume disponible desde el arranque.

## Tamaño del ticket

Un ticket es "chico" si una persona lo termina, con su gate de build en verde y PR abierto, en menos
de una sesión de trabajo continua. Si un feature del PRD es grande (ej. "reservas"), partirlo en
2-3 tickets (modelo+CRUD, validación de superposición, endpoint de disponibilidad) en vez de dejarlo
como uno solo — tickets grandes son los que generan PRs gigantes al final del día, que es justo lo
que `RUNBOOK.md` quiere evitar.

## Output

### `BACKLOG.md`

Tabla markdown, una fila por ticket:

```markdown
| # | Lane | Ticket | Depende de | Criterio de aceptación |
|---|---|---|---|---|
| 1 | A | **Stubs de todos los endpoints de Lane A** | — | Cada ruta del contrato responde el shape correcto con data hardcodeada |
| 2 | B | **Stubs de todos los endpoints de Lane B** | — | Ídem, para las rutas de Lane B |
| 3 | A | Modelo + CRUD real de vecinos y vehículos | #1 | Se puede crear un vecino con su vehículo y listarlos vía API |
| 4 | A | Modelo de horarios del cargador + disponibilidad real | #3 | GET /api/availability devuelve los slots libres y ocupados de la DB |
| 5 | A | Reservas: crear + validar superposición | #4 | POST /api/reservations rechaza con 409 si el horario se solapa |
| ... | ... | ... | ... | ... |
```

Agrupar la tabla en 3 secciones (Lane A, Lane B, Lane C) o agregar una columna de lane — lo que se
lea más claro en un vistazo. Marcar con `(nice to have)` los tickets que son extra si sobra tiempo,
según `RUNBOOK.md` §"Si algo se atrasa".

### Issues de GitHub

Uno por ticket, vía `gh issue create`:

```bash
gh issue create --title "[Lane A] Modelo + CRUD de vecinos y vehículos" \
  --body "Criterio de aceptación: ...\n\nDepende de: —" \
  --label "lane:A"
```

Crear las labels si no existen (`gh label create "lane:A" --color ...`, ídem B, C, y
`nice-to-have`). El título lleva el prefijo de lane para que se vea filtrando por nombre además de
por label. El cuerpo del issue repite criterio de aceptación y dependencias — el issue tiene que
poder leerse sin abrir `BACKLOG.md` al lado.

## Cierre

Commitear `BACKLOG.md` con mensaje `docs: backlog inicial partido en 3 lanes (#issues)`. No arrancar
`scaffold-monorepo` ni ningún código en este mismo paso — eso es la fase siguiente del runbook.
