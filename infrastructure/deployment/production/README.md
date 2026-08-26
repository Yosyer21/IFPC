# Despliegue en producción

## Arquitectura

- **Web**: Next.js (imagen `Dockerfile.web`) detrás de nginx (`infrastructure/nginx/nginx.conf`)
- **Worker**: procesamiento en background (imagen `Dockerfile.worker`)
- **Datos**: PostgreSQL 16, Redis 7
- **Storage**: S3/MinIO para vídeos y documentos

## Checklist

1. Environment variables de producción completas en `.env` (ver `.env.example`)
2. `AUTH_SECRET` generado con un generador criptográfico
3. Migraciones aplicadas: `pnpm scripts:migrate`
4. Verificación post-despliegue: `pnpm scripts:verify`
5. Certificados TLS configurados en nginx
6. Backups periódicos: `pnpm scripts:backup` (cron)
7. Monitorización activa (ver `infrastructure/monitoring`)

## Recomendaciones

- Usar un gestor de secretos (Vault, AWS Secrets Manager) para las claves
- Escalar web horizontalmente con la sesión JWT (stateless) tras nginx
- Escalar worker añadiendo réplicas de la cola BullMQ
