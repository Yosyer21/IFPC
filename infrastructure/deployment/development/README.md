# Despliegue en desarrollo

## Entorno local

### Sin Docker (PGlite embebido — recomendado para probar rápido)

```bash
pnpm install
cp .env.example .env          # define AUTH_SECRET y PGLITE_DIR (ruta ABSOLUTA)
pnpm db:setup-pglite          # cliente Prisma + esquema + datos demo (un comando)
pnpm dev                      # web en http://localhost:3000
```

> `PGLITE_DIR` debe ser absoluta y coincidir en `.env` y `apps/web/.env.local`.
> Para reiniciar la BD: borra `.pglite/` y repite `pnpm db:setup-pglite`.

### Con Docker (Postgres + Redis + MinIO)

```bash
docker compose up -d          # postgres + redis + minio
cp .env.example .env          # pon USE_PGLITE=false
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev                      # web en http://localhost:3000
```

## Users demo

| Rol     | Email                | Password |
| ------- | -------------------- | ---------- |
| Jugador | player@demo.com      | player123  |
| Familiar | parent@demo.com     | parent123  |
| Club    | club@demo.com        | club123    |
| Agente  | agent@demo.com       | agent123   |
| Ojeador | scout@demo.com       | scout123   |
| Admin   | admin@ifpc.com | (via scripts:create-admin) |

## Herramientas

- `pnpm scripts:verify` — comprueba la conexión a la base de datos
- `pnpm scripts:reset` — vacía la base de datos
- `pnpm scripts:backup` — exporta datos a `backups/`
- `pnpm scripts:seed-demo` — carga los datos de demostración
