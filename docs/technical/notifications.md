# Notificaciones

## Model

- `Notification` (userId, type, title, message, link, count, read, createdAt) en PostgreSQL.
- `NotificationPreference` (userId, category, inApp, email): canales activados **por categoría**.
  Sin fila valen los valores por defecto (dentro de la plataforma sí, email no).

## Submission

- Cola `notification` (BullMQ) · job `send-notification` (`apps/worker`).
- En desarrollo, `notifyUser` / `notifyGrouped` (`apps/web/lib/notifications/notify.ts`) insertan
  directamente (sin depender de Redis) y aplican las preferencias del usuario:
  - si silenció la categoría **no se crea** el aviso;
  - si tiene el email activo **y** la dirección verificada, se manda una copia con
    `sendNotificationEmail` (Resend).
- Los correos de seguridad (verificación y recuperación de contraseña) salen de `app/actions/auth`
  y **no** pasan por las preferencias: no se pueden desactivar.

## Types and categories

Tipos reales: `post_like`, `post_mention`, `new_follower`, `application`, `training`,
`document`.

Se agrupan en categorías configurables (`apps/web/lib/notifications/preferences.ts`):

| Categoría       | Tipos                                       |
| --------------- | ------------------------------------------- |
| `social`        | `post_like`, `post_mention`, `new_follower` |
| `opportunities` | `application`                               |
| `training`      | `training`                                  |
| `documents`     | `document`                                  |

Los filtros de la bandeja (`apps/web/lib/notifications/feed.ts`) usan una agrupación visual
más amplia (`offers`, `coach`, `social`, `documents`, `payments`, `messages`, `account`,
`system`) para que los tipos nuevos aparezcan en un sitio sensato sin migración.

Añadir un tipo nuevo solo requiere meterlo en una categoría: la tabla de preferencias está indexada
por categoría, así que **no necesita migración**.

## Weekly digest

`pnpm scripts:weekly-digest` manda un email de resumen con lo que ha pasado en la
plataforma. Es idempotente **solo por diseño de uso**: está pensado para correr una vez por
semana desde cron (p. ej. `0 9 * * 1`).

- Solo entra quien tenga activado el resumen (`NotificationPreference` con
  `category = 'weekly_digest'` y `email = true`) **y** la dirección verificada.
- Nunca manda resúmenes vacíos: si no hay avisos en la ventana, se salta al usuario.
- El contenido se agrupa por categoría (`buildDigest` en
  `apps/web/lib/notifications/digest.ts`) con los títulos y enlaces de cada grupo.
- Banderas: `--apply` (manda de verdad; sin ella solo informa), `--days 7` y
  `--user email` (forzar un destinatario para probar).
- Con PGlite hay que parar `pnpm dev` antes: la base embebida no admite dos procesos.

## Document reminders

`pnpm scripts:document-reminders` recorre los documentos con `expiresAt` y crea un aviso de
tipo `document` para el jugador:

- ventana de antelación de **30 días** (`--days 45` para cambiarla);
- los ya vencidos se recuerdan hasta **14 días** después;
- un aviso como máximo **por documento y día** (evita duplicados si corre varias veces);
- respeta las preferencias: si el jugador silenció `documents`, no se crea nada;
- sin `--apply` solo informa; `--apply` crea los avisos.

En producción va con cron una vez al día (p. ej. `0 8 * * *`). Con PGlite hay que parar
`pnpm dev` antes: la base embebida no admite dos procesos.

## UI

- Bandeja unificada (`components/notifications/notifications-view.tsx`):
  `/dashboard/{player,parent,coach,club,health-agent}/notifications`.
  Agrupa por **Today / Earlier**, filtra por categoría y por no leídos, y permite
  marcar un aviso (`markNotificationReadAction`) o todos (`markAllNotificationsReadAction`).
- `/dashboard/player/settings/notifications` configura los canales por categoría (matriz
  «In the app» / «Email»). La columna de email queda deshabilitada mientras el email no esté
  verificado.
- El grupo «Documents» de la bandeja muestra los recordatorios creados por el script.

## Email

`apps/web/lib/email/resend.ts` manda con la API REST de Resend (sin dependencia npm). Sin
`RESEND_API_KEY` deja el contenido en la consola del servidor (modo desarrollo). Plantillas: aviso,
verificación y recuperación, todas con la paleta de Future Baller (lima `#C4F747` sobre tinta
`#11151A`).
