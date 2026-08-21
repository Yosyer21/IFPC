# Logging

## Cómo se registran los eventos

- **Aplicación web**: `console.log`/`console.error` (JSON en producción recomendado)
- **Worker**: prefijos por tipo de job (`[video]`, `[matching]`, `[notification]`, `[report]`, `[analytics]`, `[maintenance]`)
- **Base de datos**: Prisma log en modo `query` solo en desarrollo

## Recomendaciones

- En producción, redirigir stdout/stderr a un recolector (ej. Loki, CloudWatch)
- Conservar los logs de auditoría de pagos y auth como mínimo 90 días
- No registrar datos personales ni tokens de sesión
