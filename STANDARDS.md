# Standards — ChargeHood hackathon

Convenciones genéricas para que las 3 lanes produzcan código que se lea como si lo hubiera escrito
una sola persona, sin gastar tiempo de hackathon discutiéndolas en vivo. Se ajustan si algo choca
con la realidad del stack elegido — esto es un punto de partida, no una ley.

## Estructura del repo

```text
/server          Express + Prisma + Postgres
  src/
    routes/       un archivo por recurso (neighbors.js, vehicles.js, reservations.js, sessions.js, ...)
    services/     lógica de negocio, sin conocer Express (req/res)
    db/           cliente Prisma, seed
  prisma/
    schema.prisma
/client           Vite + React
  src/
    pages/        una carpeta por pantalla
    components/   piezas reusables entre pantallas
    api/          funciones que llaman al backend, un archivo por recurso — el único lugar que sabe la URL base
/specs            PRD, contrato de API, modelo de datos — fuente de verdad, no el código
```

Un archivo hace una cosa. Si un route file empieza a tener lógica de negocio no trivial, esa lógica
va a `services/`.

## Contrato de API

`specs/api-contract.md` es la fuente de verdad de rutas y shapes — no el código de ninguna lane.
Si durante la implementación hace falta un campo o una ruta que el contrato no tiene: se actualiza
`specs/api-contract.md` en el mismo PR y se avisa en el canal del equipo, no se improvisa en
silencio — la lane que consume esa ruta se rompe si el shape cambia sin aviso.

Forma de error, siempre:

```json
{ "error": "mensaje legible" }
```

Nunca un string suelto, nunca un stack trace al cliente. Código HTTP correcto: `400` validación,
`404` no encontrado, `409` conflicto (ej. reserva superpuesta), `500` solo para lo verdaderamente
inesperado.

## Estilo

- JS/TS moderno: `async/await`, no callbacks anidados, no then-chains largos.
- Nombres en inglés para código (variables, funciones, rutas); el copy de UI y el spec en español.
- Sin comentarios que expliquen qué hace el código — solo cuando el porqué no es obvio (una regla de
  negocio rara, un workaround puntual).
- No agregar validación, manejo de errores o abstracciones para casos que no van a pasar en un
  demo de 6hs. Tres líneas parecidas están bien; no hace falta una función genérica para eso.

## Git / PRs

- Una rama por ticket del backlog: `lane-a/reservas-crud`, `lane-b/calculo-costo`,
  `lane-c/pantalla-dashboard`.
- Commits chicos, mensaje en imperativo, referencia al ticket: `feat: agregar CRUD de reservas (#4)`.
- PR chico, contra `main`. `pr-review` skill antes de mergear. Merge frecuente — mejor 5 PRs chicos
  que 1 gigante al final del día.
- Nunca commitear directo a `main`. Nunca `--force` a `main`.

## Env vars

Todo lo que cambia entre local y Railway va en `.env` (gitignored), con `.env.example` committeado
documentando qué variables existen. Sin defaults hardcodeados para cosas como la connection string
de la DB — si falta la env var, el server falla al bootear, no arranca con un valor incorrecto.

## Verificación (sin tests)

No hay suite de tests en este hackathon. El gate antes de cada PR es:

```bash
# server
npm run build --prefix server > /tmp/gate-server.log 2>&1; echo EXIT=$?
grep -iE 'error' /tmp/gate-server.log | tail -20

# client
npm run build --prefix client > /tmp/gate-client.log 2>&1; echo EXIT=$?
grep -iE 'error' /tmp/gate-client.log | tail -20
```

Nunca leer el resultado de un build/lint a través de un pipe directo (`npm run build | grep ...`) —
el exit code que se reporta es el del `grep`, no el del build. Redirigir a un log primero. Un hook
del proyecto (`.claude/hooks/gate-piped-build.js`) deniega esa forma de comando.
