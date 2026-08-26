# Membership (negocio)

## Plans

| Plan | Precio/year | Audiencia |
| --- | --- | --- |
| FREE | 0 € | Todos |
| PREMIUM | 59,99 € | Jugadores |
| SCOUT | 149,99 € | Ojeadores |
| CLUB | 299,99 € | Clubes |

## Reglas de negocio

- Un usuario tiene **una** membresía activa (relación 1:1 en `Membership`).
- La vigencia es de 12 meses desde la activación.
- `expire-memberships` (worker) marca como vencidas las que superen `endsAt`.
- El tier se muestra como badge en perfiles relevantes.

Ver también `docs/product/membership-model.md`.
