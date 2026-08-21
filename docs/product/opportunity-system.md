# Sistema de oportunidades

## Tipos

| Tipo | Descripción |
| --- | --- |
| **TRIAL** | Prueba deportiva organizada por el club |
| **SCOUTING** | Proceso de observación/reclutamiento |
| **CONTRACT** | Contrato directo |
| **SCHOLARSHIP** | Beca académico-deportiva |
| **ACADEMY** | Incorporación a una academia |

## Flujo

1. El club publica una oportunidad (posición, rango de edad, ubicación, fecha de cierre).
2. El jugador la explora y envía una solicitud (con mensaje opcional).
3. El estado de la solicitud evoluciona: `PENDING → IN_REVIEW → ACCEPTED/REJECTED`.
4. La solicitud puede convertirse en un **envío** del agente y avanzar al pipeline de reclutamiento
   (envío → prueba → negociación → contrato).

## Estados

- Oportunidad: `DRAFT`, `OPEN`, `CLOSED`.
- Solicitud: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.
