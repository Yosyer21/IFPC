# Despliegue en staging

## Objetivo

Entorno pre-producción con datos sintéticos para validar funcionalidades antes del lanzamiento.

## Pasos

1. Construir imágenes: `docker build -f infrastructure/docker/Dockerfile.web -t fb-web .`
2. Aplicar migraciones: `pnpm db:migrate`
3. Cargar datos demo: `pnpm db:seed`
4. Desplegar servicios con `infrastructure/docker/docker-compose.yml` (variables de entorno de staging)
5. Ejecutar la suite de tests: `pnpm test:unit` y `pnpm e2e`

## Notas

- Base de datos de staging separada de producción
- Secreto de sesión (`AUTH_SECRET`) distinto del de producción
- Logs visibles para depuración
