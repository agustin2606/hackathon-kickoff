---
name: sdd-spec
description: Produce el spec inicial de ChargeHood en formato Spec Driven Development — PRD sin jerga técnica, contrato de API y modelo de datos — antes de que exista una sola línea de código. Es el primer paso del día de hackathon y el único gate fuerte: nada se codea hasta que el equipo aprueba este output. Usar al arrancar el evento, o cuando el usuario diga "arranquemos el spec", "escribamos el PRD", "definamos el contrato de API", "/sdd-spec".
---

# sdd-spec — spec antes de código

Este skill existe porque la regla del hackathon lo exige literalmente: SDD, spec antes de código,
todo en GitHub. La idea del producto (ChargeHood) ya está dada por el equipo — este skill no
inventa el problema, lo formaliza rápido y fija las decisiones que de otro modo se descubrirían a
mitad de la implementación, rompiendo el trabajo en paralelo.

No es un diálogo largo. El equipo ya sabe qué quiere construir; este paso existe para que quede
escrito, sea consistente entre las 3 lanes, y quede un contrato de API que las desbloquee a las tres
a la vez.

## Antes de escribir — solo preguntar lo que cambia el resultado

Si la descripción del producto que trae el equipo ya cubre problema, para quién, y qué debe pasar
para considerarlo funcionando, no hace preguntas de relleno — redacta directo. Pregunta solo lo que,
sin resolver, te obligaría a adivinar una decisión de diseño (ej. "¿el cálculo de costo se hace por
kWh consumido o por tiempo de sesión?"). Una pregunta con respuesta obvia por defecto no es una
pregunta: tomá el default y decilo en el documento en vez de preguntar.

## Output — tres archivos en `specs/`

### `specs/PRD.md` — sin jerga técnica

Prohibido en esta sección: nombres de tabla, endpoint, framework, librería. Si una frase necesita
esas palabras para tener sentido, esa frase va en `api-contract.md` o `data-model.md`, no acá.

- **Problema**: qué es hoy manual/informal y qué cuesta (mensajes, planillas, acuerdos ad-hoc).
- **Para quién**: los roles concretos (vecino, administrador del edificio).
- **Qué cambia**: qué puede hacer cada rol que no podía antes.
- **Funcionalidades** (la lista que trae el equipo, una viñeta por feature).
- **Criterios de aceptación**: cada uno observable — alguien mirando la app corriendo puede decir
  sí/no. Ejemplo: "un vecino puede reservar un horario libre del cargador y ese horario deja de
  aparecer como disponible para los demás."
- **Fuera de alcance**: explícito. Esto es lo que protege el foco de las 3 lanes durante el día —
  todo lo que el equipo decide no construir hoy va acá (ej. "pagos reales", "notificaciones push",
  "más de un cargador por edificio" si no está confirmado).

### `specs/api-contract.md` — la pieza que desbloquea el paralelismo

Esto es lo que permite que Lane C (frontend) empiece el mismo minuto que A y B: el contrato se
diseña una vez, acá, no se descubre implementando.

Por cada endpoint: método, path, quién lo llama (qué lane consume, qué lane implementa), shape del
request, shape del response, códigos de error posibles. Usar la forma de error de
`STANDARDS.md` (`{ "error": "..." }`).

```markdown
### POST /reservations
Lane C llama, Lane A implementa.

Request:
{ "neighborId": "string", "slotStart": "ISO datetime", "slotEnd": "ISO datetime" }

Response 201:
{ "id": "string", "neighborId": "string", "slotStart": "...", "slotEnd": "...", "status": "confirmed" }

Errores: 409 si el horario se superpone con otra reserva, 404 si neighborId no existe.
```

Cubrir como mínimo las funcionalidades del PRD: vecinos/vehículos, disponibilidad, reservas, login
QR (simulado), registro de consumo, historial, cálculo de costo, estado de cuenta, dashboard del
edificio.

### `specs/data-model.md` — tablas Postgres

Una tabla por entidad de negocio (neighbor, vehicle, charging_slot o reservation, charge_session,
...), sus columnas y relaciones (FK). Nivel de detalle: alcanza con nombre + tipo + qué representa,
no hace falta el DDL completo — eso lo escribe `scaffold-monorepo`/la implementación. Este documento
es el que le dice a Lane A y Lane B qué tablas asumir sin pisarse.

## El gate

Al terminar de escribir los tres archivos, mostrarlos resumidos en el chat (no solo decir "listo,
revisá los archivos") y parar ahí. **No seguir a `backlog-planner` ni tocar código hasta que el
equipo confirme explícitamente que aprueba el spec.** Si piden un cambio, aplicarlo y volver a parar
— no asumir aprobación por silencio.

Una vez aprobado: commitear los tres archivos a `main` con un mensaje tipo
`docs: spec inicial de ChargeHood (PRD, contrato de API, modelo de datos)` y recién ahí sugerir
correr `backlog-planner`.
