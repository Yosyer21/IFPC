# Matching engine

Implementación: `packages/matching/src/engine.ts` (función pura, testeada con vitest).

## Score (0-100)

| Criterio | Peso | Lógica |
| --- | --- | --- |
| Position | 25 | coincidencia exacta con el requisito |
| Edad | 25 | dentro del rango (parcial si cercano ±2 años) |
| Nivel | 20 | `player.competitionLevel` = `requirement.level` |
| Disponibilidad | 15 | estado `AVAILABLE`/`ACTIVE` |
| Geography | 15 | nacionalidad compatible con país/ubicación |

- Sin restricción en un criterio → peso neutro (máximo).
- Dato faltante → puntuación parcial.
- Cada criterio devuelve `{ score, max, detail }` para explicar el resultado.
- Resumen: ≥80 muy buena, ≥60 buena, ≥40 media, resto baja.

## Uso

- Página de matching del club y del agente (orden por score, breakdown por criterio).
- **Área del jugador**: `/dashboard/player/opportunities` ordena las ofertas abiertas por
  encaje (badge `% match` + breakdown por criterio en el detalle) y el dashboard muestra
  "Oportunidades para ti" (score ≥ 60). El mapeo vive en `apps/web/lib/matching.ts`.
  `Opportunity` no tiene nivel competitivo ni país, así que esos criterios quedan neutrales
  en vez de penalizar a todos los jugadores.
- Job `calculate-matches` del worker (mejores coincidencias ≥60).

## Affinity (0-100)

`packages/matching/src/affinity.ts` → `affinityScore(player, target)`. Mide el encaje **amplio**
con un club, universidad o colegio, no un requisito concreto.

| Criterio | Peso | Lógica |
| --- | --- | --- |
| Posición necesaria | 30 | alguna necesidad abierta en su demarcación |
| Edad / categoría | 25 | dentro del rango agregado (parcial ±2 años) |
| Nivel | 15 | nivel en los niveles pedidos |
| Actividad y clips | 15 | partidos (8) + goles/asistencias (4) + clips (3) |
| Geografía | 15 | ciudad/país compatible con ubicación, nacionalidad o club |

- Sin necesidades/restricciones → peso neutro (no penaliza).
- Datos ocultos por el padre de un menor de 16 → `null`; se puntúa neutro y **no se usan**.
- `buildAffinityTarget` (`apps/web/lib/affinity.ts`) agrega los requisitos del club o las
  oportunidades abiertas de la universidad (posiciones, rango de edad y niveles).

**Dónde se usa**

- `/dashboard/club/players`: orden por afinidad, badge `% affinity` y `% fit to needs`
  (coincidencia con requisitos concretos) en cada tarjeta.
- `/dashboard/club/players/[playerId]`: badge + desglose por criterio.
- `/dashboard/university/players`: badge y orden por afinidad con el programa.
