---
name: implement-ticket
description: Implementa un ticket del BACKLOG.md de punta a punta — rama, código contra el contrato de API, gate de build en verde, PR abierto listo para pr-review. Es el paso que más veces se repite durante el día de hackathon (una vez por ticket, por lane). Usar cuando el usuario diga "arranquemos el ticket 3", "implementá esto", "tomá el próximo ticket de mi lane", "/implement-ticket".
---

# implement-ticket — de un ticket a un PR

El paso más repetido del día. Requiere que `specs/api-contract.md`, `specs/data-model.md` y
`BACKLOG.md` ya existan — si falta alguno, el proceso SDD todavía no llegó a esta fase: decilo y
parate, no improvises el spec acá.

## 1. Elegir el ticket

Del `BACKLOG.md` (o `gh issue list --label "lane:X"`), el próximo de la lane del usuario **cuyas
dependencias ya estén mergeadas en `main`**. Un ticket bloqueado no se empieza "por adelantado" —
si su dependencia cambia, el trabajo se tira. Si todos los tickets de la lane están bloqueados,
decilo y ofrecé revisar un PR de otra lane en vez de inventar trabajo.

## 2. Rama, desde `main` fresco

```bash
git checkout main && git pull
git checkout -b lane-a/nombre-corto-del-ticket
```

Prefijo de lane según `STANDARDS.md`. Nunca commitear directo a `main`.

## 3. Leer antes de escribir

- **El criterio de aceptación del ticket** — es la definición de "terminado", no la interpretación
  propia de lo que el feature debería hacer.
- **La sección de `specs/api-contract.md`** que corresponde al endpoint que se toca: método, path,
  shapes, códigos de error. Se implementa contra eso, exacto.
- **El código vecino**, si ya existe: misma estructura de carpetas, mismos nombres, mismo estilo.
  Código que se lee como el de al lado pasa review; código sólo correcto, no.

## 4. Implementar — sólo el ticket

Nada más que el criterio de aceptación. Sin tablas extra, sin endpoints no pedidos, sin refactors
de archivos que el ticket no tocaba, sin tests (este hackathon no los evalúa). Si aparece algo que
falta y no está en el ticket, se anota y se comenta — no se agrega en silencio.

**Si el contrato no alcanza** (falta un campo, hace falta una ruta que no está documentada):
actualizar `specs/api-contract.md` en el mismo PR **y avisar al equipo**, según la regla de
`STANDARDS.md` §"Contrato de API". La lane que consume esa ruta se rompe si el shape cambia sin
aviso — es el error más caro del día.

## 5. Gate de build, en verde, sin pipes

```bash
npm run build --prefix server > /tmp/gate-server.log 2>&1; echo EXIT=$?
grep -iE 'error' /tmp/gate-server.log | tail -20
```

Ídem `client` si se tocó frontend. Nunca `npm run build | grep ...` — el exit code que vuelve es el
del lector, no el del build; un hook del proyecto lo deniega.

## 6. PR

```bash
git add -A && git commit -m "feat: descripción corta del ticket (#N)"
git push -u origin lane-a/nombre-corto-del-ticket
gh pr create --base main --title "feat: descripción corta (#N)" \
  --body "Cierra #N.\n\nQué hace: ...\nContrato tocado: <sección de api-contract.md, o ninguna>"
```

PR chico. Mejor 5 PRs a lo largo del día que uno gigante al final — el merge de un PR gigante a las
5hs es el escenario que más tiempo hace perder.

## 7. Cierre

Correr `pr-review` sobre el PR antes de mergear. Después del merge, volver al paso 1 con el
siguiente ticket de la lane. No dejar la rama local dando vueltas: `git checkout main && git pull`.
