# API · Matching

## Motor

`packages/matching/src/engine.ts` — función pura `matchScore(player, requirement)`.

## Entrada

- Jugador: posición, fecha de nacimiento, nacionalidad, nivel competitivo, estado.
- Requisito: posición, rango de edad, nivel, país/ubicación.

## Salida

- `total` (0-100), `criteria[]` (score/max/detail por criterio) y `summary`.

## Uso

- Página de matching del **club** (jugadores ordenados por score con desglose).
- Página de matching del **agente** (jugadores representados vs oportunidades).
- Job del worker `calculate-matches` (mejores coincidencias ≥60).

## Test

`packages/matching/src/engine.test.ts` (vitest, 6 casos).
