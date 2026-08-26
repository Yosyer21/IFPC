# Modelo de membresía

## Plans

| Plan | Precio | Beneficios clave |
| --- | --- | --- |
| **FREE** | 0 € | Basic profile, contenido de entrenamiento, aplicar a oportunidades |
| **PREMIUM** | €59.99/year | Profile destacado, vídeos ilimitados, estadísticas de desarrollo |
| **SCOUT** | €149.99/year | Informes de scouting, búsqueda avanzada, guardar jugadores |
| **CLUB** | €299.99/year | Publicar oportunidades, requisitos, matching completo |

## Ciclo

1. El usuario elige plan en su página de membresía.
2. Se crea/actualiza la **Membership** (vigencia 12 meses) y se registra un **Payment**.
3. Un job de mantenimiento (`expire-memberships`) marca las membresías vencidas.

> Los pagos son **simulados** hasta la integración con Stripe.
