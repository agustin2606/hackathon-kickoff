# Standards — ChargeHood hackathon

Convenciones genéricas para que las 3 lanes produzcan código que se lea como si lo hubiera escrito
una sola persona, sin gastar tiempo de hackathon discutiéndolas en vivo. Se ajustan si algo choca
con la realidad del stack elegido — esto es un punto de partida, no una ley.

## Estructura del repo

```text
/                 npm workspaces — un `npm install` en la raíz instala todo
/server           Express 4 + Prisma + Postgres
  src/
    index.js      monta los routers bajo /api, después estáticos, después fallback SPA
    routes/       un archivo por recurso (neighbors.js, vehicles.js, reservations.js, sessions.js, ...)
    services/     lógica de negocio, sin conocer Express (req/res)
    db/           cliente Prisma, seed
  prisma/
    schema.prisma
  public/         build del client — generado, gitignored, nadie lo edita a mano
/client           Vite + React
  src/
    pages/        una carpeta por pantalla
    components/   piezas reusables entre pantallas
    api/          funciones que llaman al backend — siempre `fetch('/api/...')` relativo, sin URL base
/specs            PRD, contrato de API, modelo de datos — fuente de verdad, no el código
```

Un archivo hace una cosa. Si un route file empieza a tener lógica de negocio no trivial, esa lógica
va a `services/`.

**Todas las rutas de API van bajo `/api/`.** El fallback SPA de Express se come cualquier path que
no empiece con `/api`, así que una ruta fuera de ese prefijo devuelve el HTML de React en vez de
JSON — y el síntoma (`Unexpected token '<'` en el client) no dice nada sobre la causa.

### Los dos archivos compartidos

`prisma/schema.prisma` y `server/src/index.js` los tocan **las dos lanes de backend** — son los de
mayor riesgo de conflicto del repo. En los dos: cada lane escribe en su propia sección delimitada
(`// --- Lane A ---`, `// --- Lane B ---`), nunca intercalado, y `git pull` antes de empezar
cualquier ticket que los toque. Un conflicto acá a las 4hs cuesta más que los 10 segundos de
disciplina.

### Entidad nueva ⇒ seed en el mismo PR

Cualquier PR que agregue una entidad al `schema.prisma` extiende `server/src/db/seed.js` con datos
de ejemplo de esa entidad, en el mismo PR. No es opcional: el login es "elegir un vecino de la
lista", las pantallas se juzgan por cómo se ven llenas, y una tabla vacía en el demo se lee como una
feature rota. Datos concretos y creíbles (nombres reales, patentes reales, kWh plausibles), nunca
"Test 1" / "Usuario 2".

## Contrato de API

`specs/api-contract.md` es la fuente de verdad de rutas y shapes — no el código de ninguna lane.
Si durante la implementación hace falta un campo o una ruta que el contrato no tiene: se actualiza
`specs/api-contract.md` en el mismo PR y se avisa en el canal del equipo, no se improvisa en
silencio — la lane que consume esa ruta se rompe si el shape cambia sin aviso.

Cómo se avisa un cambio de contrato, concreto: (1) el cambio va en el mismo PR que lo necesita,
(2) mensaje en el canal del equipo empezando con `CONTRATO:` y la ruta afectada, (3) el PR lleva
`Contrato tocado: <sección>` en el body. Las 3 cosas, no una — las otras lanes corren en sesiones
de Claude Code aisladas y no se enteran de nada que no les llegue por un humano.

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

El client **no tiene env vars**: llama `/api/...` relativo siempre (en dev lo resuelve el proxy de
Vite, en prod es el mismo servidor). Si alguien está por agregar un `VITE_API_URL`, es señal de que
se rompió la arquitectura de un solo servicio — pararse y hablarlo.

Los valores reales (`DATABASE_URL` de Railway y cualquier otro) se comparten por el canal del
equipo o el gestor de contraseñas apenas existen, no cuando alguien se traba. Nunca en un commit.

## Verificación (sin tests)

No hay suite de tests en este hackathon. El gate antes de cada PR depende de qué se tocó.

**Client** — el build de Vite es un gate real: falla con un import roto, JSX inválido o un símbolo
que no existe.

```bash
npm run build --workspace client > /tmp/gate-client.log 2>&1; echo EXIT=$?
grep -iE 'error' /tmp/gate-client.log | tail -20
```

**Server** — ojo: es JavaScript plano, **no hay compilación que valide nada**. `prisma generate`
pasa igual con el código roto. El único gate honesto es que el server arranque y responda:

```bash
npm start > /tmp/gate-server.log 2>&1 &
sleep 4
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health   # espera 200
curl -s http://localhost:3000/api/<la-ruta-que-tocaste>                     # y su happy path
kill %1
```

Eso agarra lo que realmente rompe: un import mal escrito, un router mal montado, un error de
sintaxis, una env var faltante. Un `prisma generate` en verde no prueba nada de eso.

Si el ticket tocó un endpoint, además pegarle a **la ruta que tocaste** — happy path y, si tiene una
regla de negocio (superposición, saldo, validación), la request que debe fallar. Dos curls, 30
segundos, y es la única prueba de que la regla existe fuera de tu cabeza.

Nunca leer el resultado de un build a través de un pipe directo (`npm run build | grep ...`) — el
exit code que se reporta es el del `grep`, no el del build. Redirigir a un log primero. Un hook del
proyecto (`.claude/hooks/gate-piped-build.js`) deniega esa forma de comando.
