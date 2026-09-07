# Runbook — día del hackathon (6hs)

Timeline de referencia. Los horarios son relativos al arranque (H0:00), ajustar contra el reloj real
del evento. Cada fase nombra qué skill correr — el detalle de cada una vive en
`.claude/skills/<nombre>/SKILL.md`.

## Paso 0 — el repo del evento (antes de H0:00, ~10 min)

El harness vive en un repo de preparación. El proyecto se construye en un **repo nuevo**, creado el
día del evento — así el historial de commits del repo entregable arranca con el spec, que es
exactamente la evidencia de SDD que se evalúa.

```bash
gh repo create <org-o-usuario>/chargehood --private --clone
cd chargehood
# copiar el harness desde el repo de preparación (sin su historial de git):
cp -R ../hackathon-kickoff/.claude ../hackathon-kickoff/CLAUDE.md \
      ../hackathon-kickoff/STANDARDS.md ../hackathon-kickoff/RUNBOOK.md .
git add -A && git commit -m "chore: harness de trabajo (SDD, skills, standards)" && git push
```

Después, sin excepción, antes de que arranque el reloj:

1. **Agregar a los otros 2 como collaborators con push** (`gh repo add-collaborator`, o Settings →
   Collaborators). Si no, el primer `git push` de alguien falla a la hora 2.
2. **Los 3 clonan el repo** y abren su Claude Code adentro — el harness (skills, hook, permisos)
   sólo aplica dentro del repo.
3. Confirmar que los 3 tienen `gh` autenticado y `railway` instalado.

Si el evento exige que el repo sea público, crearlo público de entrada — cambiar la visibilidad a
último momento con los jueces esperando es riesgo gratis.

| Hora | Fase | Qué correr | Quién |
|---|---|---|---|
| H0:00–0:45 | Spec | Pasar el modelo de la sesión a **opus** (`/model`), correr `sdd-spec` skill → `specs/PRD.md` + `specs/api-contract.md` + `specs/data-model.md`, volver al modelo default después del gate | Todo el equipo, una sola sesión |
| — | **GATE** | El equipo lee y aprueba el spec. Nada de código antes de esto — es la regla del evento. | Todo el equipo |
| H0:45–1:00 | Backlog | `backlog-planner` skill → `BACKLOG.md` + issues de GitHub con lane y dependencias | Todo el equipo |
| H1:00–1:30 | Scaffold + deploy inicial | `scaffold-monorepo` skill → un servicio (Express sirve `/api` + el build de React), seed inicial, primer deploy a Railway aunque esté vacío | Una persona, el resto lee el spec |
| H1:30–2:00 | Stubs | Ticket #1 de Lane A y de Lane B: todos sus endpoints respondiendo el shape del contrato con data hardcodeada. Mergeados y deployados. | Lane A y B; Lane C arranca su primera pantalla |
| H2:00–4:30 | Desarrollo paralelo | Cada uno toma tickets de su lane. Rama → código → gate de build → `pr-review` → merge. Lane C ya trabaja contra la API real. | Lane A, B, C en paralelo |
| H4:30 | **Feature freeze** | Nada nuevo arranca. Lo que está a medias se termina o se descarta — una feature a medias resta más de lo que suma en la demo. | Todo el equipo |
| H4:30–5:15 | Cierre + integración | Terminar lo abierto, revisar los flujos punta a punta, ampliar el seed de demo, redeploy | Todo el equipo |
| H5:15–5:45 | Demo script | `demo-script` skill → camina el flujo completo, entrega script para jueces | Una persona lo corre, todos revisan |
| H5:45–6:00 | Polish + dry run | Ajustes visuales rápidos, ensayo de la presentación con el script de demo | Todo el equipo |

## Por qué este orden

- **El spec va primero y es un gate real**, no un trámite: define el contrato de API que permite que
  Lane C arranque el mismo minuto que A y B, en vez de esperar a que el backend exista. Es también
  el único paso que justifica pagar opus: un error acá se propaga a 3 lanes durante 4 horas,
  mientras que el resto del día es ejecución mecánica donde el modelo default alcanza.
- **El deploy a Railway se hace temprano, con el esqueleto vacío.** Descubrir un problema de deploy a
  H5:30 es el error más caro posible en un hackathon — mejor descubrirlo a H1:15 cuando no hay nada
  que perder.
- **Sin loop de revisión de negocio ni de tests.** dev-flow (el harness real del equipo en el
  trabajo) tiene rondas de recheck y suites completas porque protege repos que viven años. Acá el
  código vive 6 horas y se evalúa por impacto/demo/diseño, no por robustez — una sola pasada de
  review alcanza.
- **Los stubs van antes que la lógica.** Lane C llama a la API real desde su primer ticket en vez de
  mantener mocks, así que no hay una fase donde "se conecta todo" y aparecen 9 mismatches juntos. Un
  shape mal entendido se descubre a la hora 2, cuando arreglarlo es gratis.
- **`demo-script` corre antes del polish final**, no después: si el flujo tiene un problema real, hay
  30 minutos para arreglarlo antes de la presentación, no cero.
- **Hay un feature freeze explícito a H4:30**, no porque sobre tiempo sino porque nunca sobra: la
  última hora y media es cierre, demo y ensayo, y esas tres cosas son las que se evalúan. Empezar
  una feature a las 4:45 garantiza que quede a medias justo cuando hay que mostrarla.

## Si algo se atrasa

- Recortar `pr-review` a solo Critical (saltear Important) antes que recortar el spec o el backlog —
  esos son lo que hace que el proceso sea SDD de verdad.
- Si una lane termina antes, revisa PRs de otra lane o suma un ticket "nice to have" del backlog
  (marcado como tal en `backlog-planner`).
- Nunca saltear el gate de spec/backlog aunque el tiempo apriete — es una condición del evento, no
  una opción.
