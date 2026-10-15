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

Tipos reales: `post_like`, `post_mention`, `new_follower`, `application`, `training`.

Se agrupan en categorías configurables (`apps/web/lib/notifications/preferences.ts`):

| Categoría       | Tipos                                       |
| --------------- | ------------------------------------------- |
| `social`        | `post_like`, `post_mention`, `new_follower` |
| `opportunities` | `application`                               |
| `training`      | `training`                                  |

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

## UI

- `/dashboard/player/notifications` muestra la lista con marca de no leídas y
  `markNotificationsReadAction`.
- `/dashboard/player/settings/notifications` configura los canales por categoría (matriz
  «In the app» / «Email»). La columna de email queda deshabilitada mientras el email no esté
  verificado.

## Email

`apps/web/lib/email/resend.ts` manda con la API REST de Resend (sin dependencia npm). Sin
`RESEND_API_KEY` deja el contenido en la consola del servidor (modo desarrollo). Plantillas: aviso,
verificación y recuperación, todas con la paleta de Future Baller (lima `#C4F747` sobre tinta
`#11151A`).
