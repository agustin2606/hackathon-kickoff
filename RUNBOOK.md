# Runbook — día del hackathon (6hs)

Timeline de referencia. Los horarios son relativos al arranque (H0:00), ajustar contra el reloj real
del evento. Cada fase nombra qué skill correr — el detalle de cada una vive en
`.claude/skills/<nombre>/SKILL.md`.

| Hora | Fase | Qué correr | Quién |
|---|---|---|---|
| H0:00–0:45 | Spec | `sdd-spec` skill → `specs/PRD.md` + `specs/api-contract.md` + `specs/data-model.md` | Todo el equipo, una sola sesión |
| — | **GATE** | El equipo lee y aprueba el spec. Nada de código antes de esto — es la regla del evento. | Todo el equipo |
| H0:45–1:00 | Backlog | `backlog-planner` skill → `BACKLOG.md` + issues de GitHub con lane y dependencias | Todo el equipo |
| H1:00–1:15 | Scaffold + deploy inicial | `scaffold-monorepo` skill → esqueleto `/server` + `/client`, primer deploy a Railway (aunque esté vacío) | Una persona, comparte el repo |
| H1:15–4:45 | Desarrollo paralelo | Cada persona toma tickets de su lane. Rama → código → gate de build → `pr-review` → merge. Repetir. | Lane A, B, C en paralelo |
| H4:45–5:15 | Integración | Frontend contra API real (no mocks), seed de datos de demo, redeploy a Railway | Todo el equipo |
| H5:15–5:45 | Demo script | `demo-script` skill → camina el flujo completo, entrega script para jueces | Una persona lo corre, todos revisan |
| H5:45–6:00 | Polish + dry run | Ajustes visuales rápidos, ensayo de la presentación con el script de demo | Todo el equipo |

## Por qué este orden

- **El spec va primero y es un gate real**, no un trámite: define el contrato de API que permite que
  Lane C arranque el mismo minuto que A y B, en vez de esperar a que el backend exista.
- **El deploy a Railway se hace temprano, con el esqueleto vacío.** Descubrir un problema de deploy a
  H5:30 es el error más caro posible en un hackathon — mejor descubrirlo a H1:15 cuando no hay nada
  que perder.
- **Sin loop de revisión de negocio ni de tests.** dev-flow (el harness real del equipo en el
  trabajo) tiene rondas de recheck y suites completas porque protege repos que viven años. Acá el
  código vive 6 horas y se evalúa por impacto/demo/diseño, no por robustez — una sola pasada de
  review alcanza.
- **`demo-script` corre antes del polish final**, no después: si el flujo tiene un problema real, hay
  30 minutos para arreglarlo antes de la presentación, no cero.

## Si algo se atrasa

- Recortar `pr-review` a solo Critical (saltear Important) antes que recortar el spec o el backlog —
  esos son lo que hace que el proceso sea SDD de verdad.
- Si una lane termina antes, revisa PRs de otra lane o suma un ticket "nice to have" del backlog
  (marcado como tal en `backlog-planner`).
- Nunca saltear el gate de spec/backlog aunque el tiempo apriete — es una condición del evento, no
  una opción.
