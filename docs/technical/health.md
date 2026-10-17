# Health — THE “1%” FACTOR

Hub de salud del área privada: los hábitos pequeños que, repetidos, mueven la aguja
más que cualquier gesto grande. Es la traducción a producto de la idea de *marginal
gains*: **1 % mejor cada día durante un año es ×37.8; 1 % peor, ×0.03** (el propio
hub pinta ese cálculo desde `compoundGain`).

## Área compartida

`/dashboard/health` está en `SHARED_DASHBOARD_PREFIXES`
(`packages/auth/src/permissions.ts`), así que la ve **cualquier perfil con sesión**,
igual que el calendario o Discovery. La pestaña **Health** aparece en el primer
bloque del menú de los nueve roles (`components/dashboard/nav.ts`) y, por tanto,
también en el drawer móvil y en la búsqueda ⌘K.

## Contenido (sin base de datos)

No hay modelo Prisma: el contenido es **curado en código**, en `apps/web/lib/health.ts`.
Ese fichero es la **única fuente de verdad**:

- La **portada** (`/dashboard/health`) pinta la rejilla desde `HEALTH_FACTORS`.
- La **ficha** (`/dashboard/health/<slug>`) se genera a partir de la misma lista, con
  navegación anterior/siguiente (`factorNeighbours`).

Cada factor (`HealthFactor`) tiene: `slug`, `title`, `icon` (clave del mapa `ICONS`),
`tone`, `tagline` (gancho de una línea), `quickAction` (la única acción, en una
línea: la usan «Hoy: el 1 %» y el *cheat sheet*), `related` (slugs de factores
compañeros), `summary`, `why` (el mecanismo), `habits` (acciones concretas) y
`metric` (cómo saber que funciona).

## Día a día: el 1 % de hoy, ritmo semanal y progreso local

El hub no es solo lectura: da una entrada diaria y deja marcar los hábitos.

- **Hoy: el 1 %** — `factorOfTheDay` elige el factor del día con una rotación
  **determinista por fecha** (`días desde la época % nº de factores`): cambia solo
  al cambiar el día y no hay nada que guardar. Aparece como franja dentro de la
  tarjeta del cálculo, con su `quickAction` y un enlace a la ficha.
- **Ritmo semanal** — `weekPlan` reparte los factores por los días (lunes…domingo,
  0 = lunes como en el resto de la app) y la tarjeta «The week» marca el día de hoy.
- **Cheat sheet** — una `quickAction` por factor, para consultar de un vistazo.
- **Salto rápido** — chips-ancla a cada tarjeta (`#slug`), **pegajosos** bajo la
  cabecera (`sticky top-14 z-30`, por debajo del `z-40` del header), porque con siete
  tarjetas recorrer la página entera para llegar a una concreta es incómodo.
- **Buscador** — filtra los factores en vivo por título, gancho, acción rápida, resumen
  y hábitos, sin acentos ni mayúsculas (`filterFactors`), con estado vacío explicativo.
- **Tu progreso en la rejilla** — cada tarjeta muestra tu estado («Done today»,
  «2/4 today», «3-day streak») leído del mismo `localStorage`; por eso la rejilla es un
  componente cliente (`FactorGrid`) y las tarjetas conservan su `id` para las anclas.
- **Récords** — además de la racha actual, la ficha muestra la **mejor racha**
  (`bestStreak`) y los **días completados** (`progressSummary`).
- **Reinicio** — «Reset today» (desmarca el día) y «Reset factor» (borra todo el
  progreso, con confirmación en dos pasos, sin diálogos nativos del navegador).
- **Checklist de hábitos** (`components/health/habit-checklist.tsx`) — casillas por
  hábito con progreso «2/4 today», barra, **racha de días seguidos** y la tira de los
  **últimos 14 días**. Se guarda en **`localStorage`** (`ifpc.health.v1.<slug>`), así
  que no necesita base de datos ni cuenta; el día pasa al histórico **solo** cuando
  están todos los hábitos marcados. Toda la lógica (marcar, racha, saneado de lo
  guardado) es pura y está en `lib/health.ts` + `tests/unit/health`.

### Añadir un factor

1. Añade la entrada a `HEALTH_FACTORS` en `lib/health.ts` (usa un `tone` de
   `HEALTH_TONES` y un `icon` ya registrado en el mapa `ICONS` de
   `components/dashboard/icons`).
2. La portada y la ficha se generan solas: `getHealthFactor` resuelve el slug y
   `factorNeighbours` arma la navegación, así que **no hay que tocar ninguna página**.
3. `tests/unit/health/health.test.ts` comprueba que el contenido está completo (campos
   rellenos, al menos tres hábitos, slug único y tono válido).

## Diseño y responsive

Sigue el sistema de diseño de la app (lima de marca, `chip-gradient`, `Card`/`card-hover`,
`app-ambient`) y la paleta que ya usa el dashboard (`violet`, `cyan`, `emerald`, `amber`,
`sky`, `lime`). El color de cada factor va en el **chip del icono** y en el **punto**,
nunca en el texto, para que la lectura no cambie de factor a factor.

- **Portada**: rejilla de 1 columna en móvil → 2 en `sm` → 3 en `lg`, con la tarjeta del
  cálculo del 1 % arriba.
- **Ficha**: una columna (`max-w-3xl`) con los hábitos numerados y la navegación
  anterior/siguiente a ancho completo, cómoda en móvil.
- **Animaciones**: entrada escalonada con `animate-fade-up` + `animationDelay`, `card-hover`
  y realce del icono al pasar el ratón; todo respeta `prefers-reduced-motion`.

## Ficheros

| Pieza | Responsabilidad |
| --- | --- |
| `apps/web/lib/health.ts` | Contenido curado de los factores + helpers puros (`getHealthFactor`, `factorNeighbours`, `compoundGain`, `formatGain`, `factorOfTheDay`, `weekPlan`, `recentDayKeys`, `streakDays`, `bestStreak`, `progressSummary`, `normalizeProgress`, `toggleHabit`, `filterFactors`) |
| `apps/web/app/dashboard/health/page.tsx` | Portada: la idea en números + «Hoy: el 1 %», salto rápido, rejilla, ritmo semanal y *cheat sheet* |
| `apps/web/app/dashboard/health/[slug]/page.tsx` | Ficha de un factor: por qué, checklist de hábitos, cómo medirlo y «Pairs well with» |
| `apps/web/components/health/factor-grid.tsx` | Cliente: rejilla con buscador y el progreso de cada factor leído del navegador |
| `apps/web/components/health/habit-checklist.tsx` | Cliente: casillas con progreso, racha actual, mejor racha, días completados, tira de 14 días y reinicio (en `localStorage`) |
| `apps/web/components/dashboard/icons.tsx` | Iconos de salud (`health`, `moon`, `droplet`, `apple`, `heart`, `stretch`, `bulb`, `repeat`) |
| `tests/unit/health/health.test.ts` | Contenido, enlaces cruzados, navegación, 1 % compuesto, factor del día, ritmo semanal y progreso local |

## Pruebas

```bash
pnpm exec vitest run tests/unit/health tests/unit/permissions
pnpm typecheck
pnpm lint
pnpm dev   # /dashboard/health
```

## Límites y siguientes pasos

- **El progreso vive en el navegador**: es por dispositivo y por navegador, y se
  pierde al limpiar los datos. Para que viaje con la persona (y para ver rachas en
  otro móvil) hace falta un modelo (`HealthHabit`/`HealthLog`) con server actions;
  la capa pura de `lib/health.ts` ya está lista para eso (mismas funciones, otro
  almacén).
- El hub es **genérico para todos los perfiles**; si un rol necesita contenido propio
  (p. ej. pautas para familias), el siguiente paso es filtrar `HEALTH_FACTORS` por rol.
- Las lesiones y la nutrición clínica quedan fuera a propósito: el hub trata hábitos
  generales, no consejo médico.
