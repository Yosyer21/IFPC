# Despliegue en desarrollo

## Entorno local

```bash
docker compose up -d          # postgres + redis + minio
cp .env.example .env
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
