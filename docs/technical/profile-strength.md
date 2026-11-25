# Profile strength

Medidor en porcentaje del perfil, con el **mejor siguiente paso** como CTA.

## Cálculo

- `packages/config/src/profile.ts`:
  - `PROFILE_CHECKLIST`: 13 ítems con pesos que suman **100** (nombre, edad,
    nacionalidad, posición, pie, nivel, altura/peso, club, bio, foto, portada,
    headline y trayectoria).
  - `profileChecklistScore(done, checklist)`: % ponderado, ítems completados y el
    pendiente de más peso (`next`).
  - `CLUB_PROFILE_CHECKLIST`: misma mecánica para clubes.
- `apps/web/lib/player.ts`:
  - `playerProfileChecklist(player)`: traduce los datos reales del jugador
    (incluye `User.image` y el nº de temporadas de `CareerEntry`).
  - `nextProfileStep(checklist, highlightCount)`: si aún no hay clips, propone
    **«Add a highlight clip»** (Film Room); si ya hay, el pendiente de más peso.
  - `healthAgentProfileChecklist` vive en `apps/web/lib/health-agent.ts`.

## Dónde se muestra

- `/dashboard/player/profile`: tarjeta completa (`ProfileChecklistCard`) con todos
  los ítems pendientes y sus enlaces.
- `/dashboard/player` y `/dashboard/player/id`: medidor compacto
  (`ProfileStrengthMeter`, donut + % + siguiente paso).
- `/dashboard/player/opportunities` (Transfer Window): % y CTA.
- `/dashboard/club/profile`: checklist del club.
- `/dashboard/health-agent`: checklist del especialista.

## Reglas

- Solo cuenta lo estrictamente verdadero; sin datos → 0%.
- Un ítem oculto por privacidad (p. ej. clips de un menor) no se usa para el
  consejo de afinidad, pero la fuerza del perfil no depende de esos datos.
- Añadir un ítem obliga a rebalancear los pesos a 100 y actualizar
  `tests/unit/calculations/profile.test.ts`.
