---
name: scaffold-monorepo
description: Bootstrapea en vivo el monorepo de ChargeHood — un solo servicio Express que sirve la API bajo /api y el build de React como estático — y hace el primer deploy a Railway con el esqueleto vacío. Correr una sola vez, justo después de que BACKLOG.md exista, antes de que cualquier lane empiece a implementar tickets. Usar cuando el usuario diga "armemos el esqueleto", "scaffoldeá el proyecto", "iniciemos el repo", "/scaffold-monorepo".
---

# scaffold-monorepo — esqueleto + deploy temprano

Requiere `specs/data-model.md` y `BACKLOG.md` ya aprobados/creados. Se corre **una sola vez**, por
una sola persona; el resto del equipo clona el resultado en vez de scaffoldear cada uno por su lado.

Objetivo doble: (1) base mínima sobre la que las 3 lanes agregan código sin pisarse, (2) confirmar
que el deploy a Railway funciona **temprano**, con el esqueleto vacío, en vez de descubrir un
problema de infra a última hora.

## La decisión de arquitectura: un solo servicio

Express sirve **las dos cosas**: la API bajo `/api/*` y el build de React como archivos estáticos.
No son dos servicios de Railway, no son dos URLs.

Por qué, y por qué esto no se rediscute el día del evento:

- **Cero CORS en producción** — mismo origen. CORS mal configurado es de los bugs que más tiempo
  comen y aparece justo cuando deployás.
- **Una sola URL pública** para los jueces, no dos.
- **Sin `VITE_API_URL`** — el client siempre llama `/api/...` relativo. En dev el proxy de Vite
  redirige a Express; en prod es el mismo servidor. Una variable menos que puede estar mal.
- **Un solo `railway up`**, un solo set de env vars.

```text
/                       npm workspaces: un `npm install` instala las dos partes
  package.json          scripts que orquestan client + server
  server/
    src/index.js        Express: rutas /api/* + estáticos + fallback SPA
    src/routes/         un archivo por recurso
    src/services/       lógica de negocio
    src/db/             cliente Prisma + seed
    prisma/schema.prisma
    public/             ← acá cae el build del client (gitignored)
  client/
    vite.config.js      build.outDir → ../server/public · proxy /api → localhost:3000
    src/
  specs/
```

## Pasos

### 1. Raíz

`package.json` en la raíz con workspaces y los scripts que usan Railway y el gate:

```json
{
  "name": "chargehood",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "build": "npm run build --workspace client && npm run generate --workspace server",
    "start": "npm run start --workspace server",
    "seed": "npm run seed --workspace server"
  }
}
```

`.gitignore`: `node_modules`, `.env`, `server/public`.

### 2. `/server`

```bash
mkdir -p server/src/{routes,services,db} server/prisma
npm install express@^4 cors dotenv @prisma/client --workspace server
npm install -D prisma nodemon --workspace server
npx prisma init --datasource-provider postgresql
```

**Express 4, no 5, a propósito**: en Express 5 cambió `path-to-regexp` y el fallback clásico
`app.get('*', ...)` tira error. Igual, para no depender de eso, el fallback va como middleware final
(funciona en las dos versiones).

`src/index.js`, en este orden exacto:

```js
app.use(cors());                                  // solo hace falta en dev (client en :5173)
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// ... acá monta cada router: app.use('/api/neighbors', neighborsRouter) etc.
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));  // fallback SPA
app.listen(process.env.PORT || 3000);
```

El fallback SPA va **último**, después de las rutas de API — si va antes, se come todos los
endpoints y todo devuelve el HTML del index.

Scripts de `server/package.json`: `"dev": "nodemon src/index.js"`,
`"start": "prisma db push && node src/index.js"`, `"generate": "prisma generate"`,
`"seed": "node src/db/seed.js"`.

`prisma db push` en el start aplica el schema en cada boot (idempotente, sin archivos de migración —
lo correcto para un hackathon, no para producción real).

`.env.example`: `DATABASE_URL=` y `PORT=`, sin valores reales.

### 3. `/client`

```bash
npm create vite@latest client -- --template react
npm install --workspace client
```

`vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  build: { outDir: '../server/public', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
```

`src/api/client.js`: un único helper que hace `fetch('/api/...')` — path relativo, sin URL base, sin
env var. Todo el resto del client llama funciones de acá.

Confirmar que `npm run build` en la raíz deja archivos en `server/public/` antes de seguir.

### 4. Seed inicial

`server/src/db/seed.js` con los vecinos de demo — **hace falta desde el minuto uno**: el login es
"elegir un vecino de la lista", así que sin vecinos seedeados la app no se puede ni usar, y Lane C
necesita data realista para que las pantallas no se vean vacías. Nombres reales, no "Usuario 1".

### 5. Deploy a Railway

```bash
railway init
railway add --database postgres
railway up
```

- Un solo servicio, root del repo. Build command `npm install && npm run build`, start `npm start`.
- `DATABASE_URL` la inyecta el plugin de Postgres. Confirmar que el servicio la ve.
- Verificar `GET /api/health` **desde la URL pública** antes de dar el paso por cerrado, y que la
  raíz `/` devuelva el HTML de React. Si algo falla, es ahora cuando hay que descubrirlo.
- Correr el seed una vez contra la base de Railway (`railway run npm run seed`).

## Cierre

Commit del esqueleto (nunca `.env` real, `node_modules` ni `server/public`) con mensaje
`chore: scaffold inicial (single service) + deploy a Railway`. Avisar al equipo: URL pública,
que ya pueden ramificar, y que **los tickets de stubs de Lane A y Lane B son lo primero** (ver
`BACKLOG.md`), porque Lane C depende de que existan para no trabajar contra mocks.
