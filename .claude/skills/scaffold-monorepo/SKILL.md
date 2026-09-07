---
name: scaffold-monorepo
description: Bootstrapea en vivo el monorepo de ChargeHood — /server (Express + Prisma + Postgres) y /client (Vite + React) — y hace el primer deploy a Railway con el esqueleto vacío. Correr una sola vez, justo después de que BACKLOG.md exista, antes de que cualquier lane empiece a implementar tickets. Usar cuando el usuario diga "armemos el esqueleto", "scaffoldeá el proyecto", "iniciemos el repo", "/scaffold-monorepo".
---

# scaffold-monorepo — esqueleto + deploy temprano

Requiere `specs/data-model.md` y `BACKLOG.md` ya aprobados/creados — si no existen, decir que faltan
y no improvisar estructura sin ellos.

Esto se corre **una sola vez**, por una sola persona, antes de que las 3 lanes empiecen a tocar
código. El resto del equipo clona/pullea el resultado en vez de scaffoldear cada uno por su lado.

Objetivo doble: (1) dejar una base mínima sobre la que las 3 lanes puedan agregar código sin
pisarse, (2) confirmar que el deploy a Railway funciona **temprano**, con el esqueleto vacío, para
no descubrir un problema de infraestructura a último momento.

## Pasos — `/server`

```bash
mkdir -p server/src/{routes,services,db} server/prisma
cd server
npm init -y
npm install express cors dotenv @prisma/client
npm install -D prisma nodemon
npx prisma init --datasource-provider postgresql
```

- `src/index.js`: Express app, `cors()`, `express.json()`, monta las rutas, escucha `process.env.PORT`.
- `GET /health` → `{ "status": "ok" }` — Railway y el equipo lo usan para confirmar que el server
  está vivo, antes de que exista ningún endpoint de negocio.
- `prisma/schema.prisma`: el datasource apunta a `env("DATABASE_URL")`. Las tablas del modelo de
  datos las agrega cada lane en sus propios tickets — este paso no las escribe, salvo que
  `data-model.md` ya las tenga completamente definidas y el equipo quiera arrancar con el schema ya
  cargado.
- `.env.example` con `DATABASE_URL=` y `PORT=` documentados, sin valores reales. `.env` real va en
  `.gitignore`.
- `package.json` scripts: `"dev": "nodemon src/index.js"`, `"start": "node src/index.js"`,
  `"build": "prisma generate"` (o el equivalente que el stack final necesite).

## Pasos — `/client`

```bash
npm create vite@latest client -- --template react
cd client
npm install
```

- `src/api/client.js`: un único lugar que sabe la URL base del backend (`import.meta.env.VITE_API_URL`),
  el resto del código llama funciones de acá, nunca hardcodea la URL.
- `.env.example` con `VITE_API_URL=http://localhost:3000` documentado.
- Confirmar que `npm run build` corre limpio antes de seguir — es lo primero que el gate de CI/deploy
  va a exigir.

## Deploy inicial a Railway

```bash
railway init
railway add --plugin postgresql
railway up
```

- Configurar variables de entorno del servicio (`DATABASE_URL` la inyecta el plugin de Postgres
  automáticamente, agregar el resto de `server/.env.example`).
- `railway.json` o `Procfile` en la raíz apuntando al start command de `/server`. Si Railway sirve
  `/client` como sitio estático aparte, documentar la URL de cada uno en el `README.md` de la raíz.
- Confirmar `GET /health` respondiendo desde la URL pública de Railway antes de dar este paso por
  cerrado — este es el momento de descubrir un problema de deploy, no a la hora 5:30.

## Cierre

Commitear el esqueleto (`server/`, `client/`, `railway.json`, `.env.example` de cada uno, nunca
`.env` real ni `node_modules`) con mensaje `chore: scaffold inicial de server y client + deploy a
Railway`. Avisar al equipo la URL pública y que ya pueden ramificar desde acá según su ticket de
`BACKLOG.md`.
