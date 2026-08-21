# Notificaciones

## Modelo

`Notification` (userId, type, title, message, read, createdAt) en PostgreSQL.

## Envío

- Cola `notification` (BullMQ).
- Job `send-notification` crea el registro en BD (visible en el panel de notificaciones).
- Email (Resend) pendiente de configuración: cuando `RESEND_API_KEY` esté disponible, el job
  enviará también un correo.

## Tipos

application · match · trial · negotiation · contract · payment · reminder

## UI

- `/dashboard/player/notifications` (y admin) muestran la lista con marca de no leídas.
- Acción `markNotificationsReadAction` marca todas como leídas.
