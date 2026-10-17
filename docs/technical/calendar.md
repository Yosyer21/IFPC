# Calendario

Vista **de solo lectura** que reúne en una rejilla mensual lo que ya está
repartido por la plataforma. No crea ni edita nada: **no hay modelo
`CalendarEvent`** ni migración. El valor está en agregar y en aplicar el mismo
criterio de visibilidad que cada área, para no mostrar un enlace que el usuario
no podría abrir.

## Área compartida

`/dashboard/calendar` está en `SHARED_DASHBOARD_PREFIXES`
(`packages/auth/src/permissions.ts`), así que lo ve **cualquier perfil con
sesión**, igual que Discovery o las salas de vídeo. La pestaña **Calendar**
aparece en el primer bloque del menú de los nueve roles (`components/dashboard/nav.ts`)
y, por tanto, también en el drawer móvil y en la búsqueda ⌘K.

## Qué eventos entran (y quién los ve)

| Tipo | Origen | Regla de visibilidad |
| --- | --- | --- |
| `live` — Live session | `LiveSession.startsAt` | Pública; del club; del coach; o 1:1 del jugador (mismo criterio que `canViewLiveSession`, aplicado en bloque) |
| `room` — Video room | `TrainingRoom.startsAt` | Quien la abre (coach/club) o el invitado / su audiencia |
| `trial` — Trial | `Trial.startsAt` | Club que lo organiza, jugador citado o jugador representado |
| `camp` — Camp | `Camp.startsAt` | Los `OPEN`/`FULL` son públicos; el club/coach también ve los suyos |
| `deadline` — Deadline | `Opportunity.closesAt` | Club/universidad que la publica; el jugador/familiar solo de las suyas (solicitadas o guardadas); el resto de roles, las abiertas |
| `pathway` — Pathway | `Pathway.startsAt`/`endsAt` | Datos privados: solo el jugador y su familia |
| `goal` — Goal | `PlayerGoal.dueDate` (no completadas) | Datos privados: solo el jugador y su familia |

`admin` ve todo. El contexto del espectador (a qué jugadores, coaches y clubes
pertenece) se resuelve **una sola vez** en `loadCalendarContext`
(`apps/web/lib/calendar.ts`), reutilizando los helpers que ya existían
(`coachClubIds`, `clubCoachIds`, `ACTIVE_CONTRACT_STATUSES`).

## Fechas y horas

Todo se maneja en **UTC**: es lo que ya hace la plataforma al anunciar un live y
así el render del servidor es determinista (y los tests no dependen de la zona
horaria de la máquina). La página lo indica con `· HH:MM UTC`.

## Diseño, responsive y animaciones

La vista usa **el sistema de diseño de la app** (no una paleta propia): el acento es
el **lima de marca** (`brand`, `chip-gradient`) y las familias que ya emplea el
dashboard (`emerald`, `amber`, `red`, `cyan`, `violet`). El color de cada tipo va en
el **filete izquierdo** de la ficha y en el **punto** de la leyenda; el cuerpo es
neutro para que el texto se lea igual siempre. Las tarjetas son las del sistema
(`Card` + `card-hover`) y el fondo sigue siendo el `app-ambient`.

**Administración del espacio:**

- **Escritorio (`lg`)**: dos columnas — rejilla del mes a la izquierda y agenda
  («Next up» + «This month») a la derecha, donde antes se desperdiciaba el ancho.
- **Móvil**: la rejilla no puede llevar texto en siete columnas, así que cada día
  muestra **puntos de color** (cuánta actividad hay y de qué tipo) y la lista de
  «Next up» ocupa el ancho completo. Las fichas con título aparecen desde `sm`.
- Cada celda muestra hasta **3 fichas**; el resto se resume en `+N more`, cuyo
  `title` lista los títulos que no caben (funciona sin JavaScript).

**Selección de día (lo que resuelve el móvil):** cada casilla es un enlace que fija
`?day=YYYY-MM-DD` (y añade `#selected-day` para bajar al detalle al elegir). Justo
**debajo de la rejilla** se pinta el **detalle del día** con todos sus eventos y sus
enlaces: en el móvil las casillas solo pueden mostrar puntos, así que este bloque es
lo que hace el calendario realmente utilizable. El día elegido lo resuelve
`resolveSelectedDay` (día de la URL → hoy si está en el mes → primer día con eventos
→ día 1), se marca con un anillo lima y se expone con `aria-current="date"`. Al
cambiar de mes el `?day` se descarta y se vuelve a resolver por defecto.

**Animaciones** (todas respetan `prefers-reduced-motion`, ya cubierto en `globals.css`):
entrada escalonada de las casillas y las fichas con `animate-fade-up` + `animationDelay`,
tinte y elevación al pasar el ratón, `animate-scale-in` en la tarjeta «Next up» y
un punto `animate-pulse-dot` en el día de hoy.

## Ficheros

| Pieza | Responsabilidad |
| --- | --- |
| `apps/web/lib/calendar.ts` | Funciones puras (rejilla, `?month=`, `?day=`, agrupado, próximos) + `listCalendarEvents` con las consultas por rol |
| `apps/web/app/dashboard/calendar/page.tsx` | Server component: barra del mes (`?month=YYYY-MM`), leyenda, rejilla de días seleccionables, detalle del día (`#selected-day`), «Next up» y resumen «This month» |
| `packages/config/src/calendar.ts` | Tipos de evento (`CALENDAR_EVENT_KINDS`), etiquetas y cabeceras de la semana (única fuente de verdad) |
| `tests/unit/calendar/calendar.test.ts` | Rejilla, normalización de mes, día seleccionado, agrupado y próximos eventos |

## Añadir una fuente nueva

1. Añade el tipo a `CALENDAR_EVENT_KINDS` y su etiqueta en `CALENDAR_EVENT_LABELS`
   (`packages/config/src/calendar.ts`) y su color en `TONES`
   (`page.tsx`).
2. Escribe su `where` por rol y un `xxxEvents(context, range)` en `lib/calendar.ts`,
   y añádelo a `Promise.all` de `listCalendarEvents`.

## Pruebas

```bash
pnpm exec vitest run tests/unit/calendar tests/unit/permissions
pnpm typecheck
pnpm e2e   # opcional: la app levantada con `pnpm dev`
```

## Límites y siguientes pasos

- **Solo lectura**: no se crean eventos propios. Si más adelante se quiere una
  agenda editable, el siguiente bloque es un modelo `CalendarEvent` (con
  `ownerId`, `title`, `startsAt`, `endsAt`) y sus server actions.
- **Horas en UTC**: si se quiere la hora local del navegador habrá que mover el
  formateo a un componente cliente.
- **Recurrentes**: las sesiones semanales del Football Center (`TrainingSession.weekday`)
  no entran todavía porque no tienen hora ni fecha concreta.
