# Motor de matching

Implementación: `packages/matching/src/engine.ts` (función pura, testeada con vitest).

## Score (0-100)

| Criterio | Peso | Lógica |
| --- | --- | --- |
| Posición | 25 | coincidencia exacta con el requisito |
| Edad | 25 | dentro del rango (parcial si cercano ±2 años) |
| Nivel | 20 | `player.competitionLevel` = `requirement.level` |
| Disponibilidad | 15 | estado `AVAILABLE`/`ACTIVE` |
| Geografía | 15 | nacionalidad compatible con país/ubicación |

- Sin restricción en un criterio → peso neutro (máximo).
- Dato faltante → puntuación parcial.
- Cada criterio devuelve `{ score, max, detail }` para explicar el resultado.
- Resumen: ≥80 muy buena, ≥60 buena, ≥40 media, resto baja.

## Uso

- Página de matching del club y del agente (orden por score, desglose por criterio).
- Job `calculate-matches` del worker (mejores coincidencias ≥60).
