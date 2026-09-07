---
name: pr-review
description: Revisión liviana de un PR de ChargeHood antes de mergear — una sola pasada, sin rondas, sin necesidad de tests. Chequea que cumple specs/api-contract.md, sigue STANDARDS.md y no tiene scope creep. Usar antes de mergear cualquier PR del hackathon, o cuando el usuario diga "revisá este PR", "dale una pasada antes de mergear", "/pr-review".
---

# pr-review — una pasada, no un proceso

No hay bot reviewer en este hackathon y no hay tiempo para rondas de review. Esto es una sola pasada
por un humano o un agente, sobre el diff del PR contra `main`. Se aplica lo Critical antes de
mergear; lo demás se anota y se sigue — 6 horas no alcanzan para pulir cada PR a fondo.

## Qué mirar

1. **Contrato**: si el PR toca un endpoint, ¿el shape de request/response coincide con
   `specs/api-contract.md`? Si no coincide, ¿el PR actualizó el contrato en el mismo commit y avisó,
   o lo cambió en silencio? Un cambio de contrato sin aviso rompe a la lane que lo consume — es el
   hallazgo más caro posible acá.
2. **Standards**: estructura de carpetas, forma de error (`{ "error": "..." }`), nombres en inglés
   para código — según `STANDARDS.md`. No perseguir nits de estilo que no cambian el significado.
3. **Scope**: el PR hace lo que dice el ticket de `BACKLOG.md` y nada más. Una tabla extra, un
   endpoint no pedido, un refactor de archivos que no tocaba el ticket → flag, no aplicar sin
   preguntar.
4. **Build gate**: el PR tiene que traer el build en verde (server y/o client, según lo que toque).
   Si no corrió el gate, correrlo ahora — nunca leído por pipe (ver `.claude/hooks/gate-piped-build.js`
   y `STANDARDS.md`).
5. **Correctness básico**: leer el diff real, no solo el resumen del autor. Un bug obvio (variable
   mal usada, condición invertida, falta un `await`) es Critical acá aunque no haya tests que lo
   agarren.

Fuera de alcance de esta skill: performance, seguridad exhaustiva, cobertura de tests — no hay
tiempo ni necesidad en un hackathon de 6hs.

## Severidad

- **Critical**: rompe el contrato sin avisar, bug que tira abajo el flujo, build roto. Se aplica el
  fix antes de mergear.
- **Important**: no sigue standards, scope creep menor. Se anota en el PR; se arregla si hay tiempo,
  si no se documenta como deuda consciente y se mergea igual — no bloquea.

## Output

Un comentario por hallazgo, formato `archivo:línea — problema — fix sugerido`. Al final, un veredicto
de una línea: `OK para mergear` / `Mergeable con Important pendiente: <lista>` / `Bloqueado por
Critical: <lista>`.

No re-revisar el mismo PR una segunda vez salvo que el Critical encontrado haya generado un cambio
de diff — esta skill es una pasada, no un loop.
