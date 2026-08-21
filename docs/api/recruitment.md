# API · Reclutamiento

## Pipeline

```
Submission → Trial → Negotiation → Contract
```

## Modelos

- **Submission**: jugador + club + agente (opcional) + etapa + estado.
- **Trial**: fechas, ubicación, estado (SCHEDULED/COMPLETED/CANCELLED/NO_SHOW).
- **Negotiation**: oferta (importe + divisa) y estado.
- **Contract**: salario, vigencia, estado de firma, `signedAt`.

## Acciones

- `createSubmissionAction` (agente): envía un jugador representado a un club.
- `addPlayerAction` (agente): vincula un jugador por email.
- El detalle de envío muestra el **pipeline de etapas** y enlaza a cada registro.

## Administración

- `AdminRecruitmentPage` resume las 4 etapas con listados recientes.
