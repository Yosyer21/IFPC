# API · Reclutamiento

## Pipeline

```
Submission → Trial → Negotiation → Contract
```

## Models

- **Submission**: player + club + agent (optional) + stage + status.
- **Trial**: fechas, ubicación, estado (SCHEDULED/COMPLETED/CANCELLED/NO_SHOW).
- **Negotiation**: offer (amount + currency) and status.
- **Contract**: salary, duration, signing status, `signedAt`.

## Acciones

- `createSubmissionAction` (agente): envía un jugador representado a un club.
- `addPlayerAction` (agente): vincula un jugador por email.
- El detalle de envío muestra el **pipeline de etapas** y enlaza a cada registro.

## Administration

- `AdminRecruitmentPage` resume las 4 etapas con listados recientes.
