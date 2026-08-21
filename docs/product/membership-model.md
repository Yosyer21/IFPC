# Modelo de membresía

## Planes

| Plan | Precio | Beneficios clave |
| --- | --- | --- |
| **FREE** | 0 € | Perfil básico, contenido de entrenamiento, aplicar a oportunidades |
| **PREMIUM** | 59,99 €/año | Perfil destacado, vídeos ilimitados, estadísticas de desarrollo |
| **SCOUT** | 149,99 €/año | Informes de scouting, búsqueda avanzada, guardar jugadores |
| **CLUB** | 299,99 €/año | Publicar oportunidades, requisitos, matching completo |

## Ciclo

1. El usuario elige plan en su página de membresía.
2. Se crea/actualiza la **Membership** (vigencia 12 meses) y se registra un **Payment**.
3. Un job de mantenimiento (`expire-memberships`) marca las membresías vencidas.

> Los pagos son **simulados** hasta la integración con Stripe.
