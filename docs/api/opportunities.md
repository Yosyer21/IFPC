# API · Oportunidades

## Model

`Opportunity` (clubId, título, tipo, estado, posición, edad, ubicación, descripción, cierre) + `Application`.

## Types

TRIAL · SCOUTING · CONTRACT · SCHOLARSHIP · ACADEMY

## Flujo

1. **Club** publica (`createOpportunityAction`).
2. **Player** explora y envía solicitud (`applyToOpportunityAction`), único por par jugador-oportunidad.
3. **Estados** de la solicitud: PENDING → ACCEPTED/REJECTED/WITHDRAWN.
4. **Admin** puede cerrar oportunidades (`closeOpportunityAction`).

## Vistas

- Jugador: `/dashboard/player/opportunities` (+ aplicaciones y guardadas).
- Club: `/dashboard/club/opportunities`.
- Agente/Ojeador: listados públicos de oportunidades abiertas.
