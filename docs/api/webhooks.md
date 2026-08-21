# API · Webhooks

## Uso previsto

Puntos de entrada para servicios externos que informan eventos a la plataforma:

| Webhook | Proveedor | Evento |
| --- | --- | --- |
| `/api/webhooks/stripe` | Stripe | Pago confirmado, suscripción cancelada |
| `/api/webhooks/video` | Worker/video | Procesamiento completado |

## Seguridad

- Verificar la firma del payload (cabecera de firma del proveedor).
- Responder rápidamente (2xx) y encolar el procesamiento en BullMQ.
- Endpoint dedicado por proveedor para mantener la verificación simple.

## Estado actual

- Endpoint scaffold `GET/POST /api/webhooks` responde `{ ok: true }`.
- Implementación real con Stripe pendiente (`STRIPE_WEBHOOK_SECRET`).
