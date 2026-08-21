# Alertas

## Reglas sugeridas

| Alerta | Condición | Severidad |
| ------ | --------- | --------- |
| Web caída | 5xx > 5% durante 5 min | Crítica |
| Latencia alta | p95 > 1s durante 10 min | Alta |
| Cola bloqueada | jobs con > 10 min de retraso | Alta |
| Redis caído | sin conectividad > 1 min | Crítica |
| Postgres lleno | espacio > 80% | Alta |
| Jobs fallidos | > 10% de fallos en 1 h | Media |
| Pagos fallidos | tasa de fallo > 5% | Media |

## Canales

- Email y Slack/Teams para alertas críticas
- Páginas a guardia solo para incidentes de disponibilidad

## Gestión de incidentes

- Documentar el incidente (qué, cuándo, impacto, causa, remediación)
- Revisión post-mortem semanal
