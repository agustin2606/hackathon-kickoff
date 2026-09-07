# ChargeHood — hackathon harness

Web app para coordinar el uso de cargadores de EV compartidos en un edificio. Construida en un
hackathon de un día (~6hs), con **Spec Driven Development (SDD)**: nada se codea antes de que el
spec y el backlog existan y estén aprobados, y todo el proceso queda en GitHub.

Este archivo es el harness — cómo trabajamos hoy, no qué es ChargeHood. El spec del producto vive en
`specs/PRD.md`, `specs/api-contract.md` y `specs/data-model.md` (se generan en vivo con la skill
`sdd-spec`, no existen todavía en este commit).

## No negociables del evento

- SDD: spec + backlog documentados en GitHub **antes** de la primera línea de código de producto.
- Demo pública disponible al momento de la evaluación (deploy en Railway).
- Se evalúa impacto, presentación no-técnica, originalidad, diseño visual y cantidad de
  funcionalidades — **no** hay bonus por cobertura de tests. No se invierte tiempo en testing más
  allá del gate de build/lint y del `demo-script` final.

## Fases del día — qué skill corre en cada una

Timeline completo en `RUNBOOK.md`. Resumen:

1. **Spec** (`sdd-spec` skill) → `specs/PRD.md` + `specs/api-contract.md` + `specs/data-model.md`.
   **Gate**: el equipo aprueba esto antes de que exista una sola rama de código.
2. **Backlog** (`backlog-planner` skill) → `BACKLOG.md` + issues de GitHub, partidos en 3 lanes con
   dependencias explícitas.
3. **Scaffold** (`scaffold-monorepo` skill) → esqueleto de `/server` y `/client`, deploy inicial a
   Railway ya en esta fase (asegurar la URL pública temprano, no al final).
4. **Desarrollo paralelo** — cada persona toma tickets de su lane, PR chico por ticket, `pr-review`
   skill antes de mergear.
5. **Integración** — frontend contra backend real, seed de datos de demo, redeploy.
6. **Demo script** (`demo-script` skill) — camina el flujo end-to-end y entrega a los jueces un
   script concreto para mostrar.

## Lanes (3 personas, cada una con su propio Claude Code)

- **Lane A — Backend Core**: vecinos/vehículos, disponibilidad del cargador, reservas.
- **Lane B — Backend Billing/Sessions**: login QR simulado, registro de consumo, cálculo de costo,
  estado de cuenta, endpoints de dashboard/agregación.
- **Lane C — Frontend**: todas las pantallas, contra `specs/api-contract.md` — no espera a que A/B
  terminen de implementar, solo a que el contrato esté fijado en el spec.

El contrato de API se fija en el spec (paso 1), no se descubre implementando — es lo que permite que
las 3 lanes arranquen a la vez sin bloquearse entre sí.

## Stack

- Backend: Node/Express + Prisma + Postgres (Railway addon).
- Frontend: Vite + React.
- Monorepo: `/server` y `/client` en un solo repo.
- Auth: sin password — el usuario se elige de una lista de vecinos preseed.
- QR: simulado — el QR codifica el id del vecino; se "escanea" con una lib JS o se ingresa a mano
  como fallback.
- Deploy: Railway.

Convenciones de código, commits y flujo de git → `STANDARDS.md`.

## Verificación

Nunca se juzga un build/lint/test leyendo su salida a través de un pipe (`| grep`, `| tail`, ...) —
un hook (`.claude/hooks/gate-piped-build.js`) lo deniega, porque el exit code que se reporta es el
del lector, no el del comando real. Redirigir a un log, chequear `$?`, después grepear el log.

## Maintaining this file

Sólo contexto específico de este repo va acá. Si algo se puede derivar leyendo `specs/` o
`BACKLOG.md`, no se duplica acá.
