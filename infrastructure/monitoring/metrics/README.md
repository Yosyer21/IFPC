# Métricas

## Métricas clave a monitorizar

| Métrica | Fuente |
| ------- | ------ |
| Tiempo de respuesta web (p95) | APM (ex. Grafana Cloud, Datadog) |
| Tasa de error HTTP (5xx) | nginx / APM |
| Latencia de jobs BullMQ | worker (logs + métricas de Redis) |
| Tamaño de colas (video, matching, notification) | BullMQ / Redis |
| Uso de CPU/memoria web y worker | contenedores |
| Conexiones y latencia de PostgreSQL | Postgres exporter |
| Uso de almacenamiento S3 | bucket metrics |

## Recomendaciones

- Exportar métricas en formato Prometheus desde web/worker (ej. `prom-client`)
- Dashboards por área: web, worker, colas, base de datos, negocio
