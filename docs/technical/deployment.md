# Despliegue

## Local

```bash
docker compose up -d
cp .env.example .env
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Producción

- Imágenes Docker: `infrastructure/docker/Dockerfile.web` y `Dockerfile.worker`.
- Compose de producción: `infrastructure/docker/docker-compose.yml`.
- Proxy: nginx (`infrastructure/nginx/nginx.conf`) con TLS.
- Migraciones: `pnpm scripts:migrate` (migrate deploy).
- Verificación: `pnpm scripts:verify`.

## Entornos

- `development/` — docker-compose raíz + usuarios demo.
- `staging/` — pre-producción con datos sintéticos.
- `production/` — checklist completo (ver `infrastructure/deployment/production`).

## CI/CD

Workflows en `.github/workflows`: lint → typecheck → test → build → deploy.
