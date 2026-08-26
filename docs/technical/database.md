# Database

Motor: **PostgreSQL** vía **Prisma ORM** (`packages/database/prisma/schema.prisma`).

## Main models

- **Cuentas**: `User` (rol, hash de contraseña), `Player`, `Parent`, `Coach`, `Scout`, `Agent`, `Club`, `University`, `Academy`, `ClubStaff`.
- **Desarrollo**: `TrainingContent`, `Pathway`, `PlayerGoal`, `Evaluation`, `Document`.
- **Video**: `Video` (estado: uploading/processing/ready/failed).
- **Opportunities**: `Opportunity`, `Application`.
- **Reclutamiento**: `Submission`, `Trial`, `Negotiation`, `Contract` (pipeline enlazado).
- **Scouting**: `ScoutingReport`, `SavedPlayer`.
- **Contacto**: `Inquiry`, `Requirement`.
- **Negocio**: `Membership`, `Payment`.
- **Sistema**: `Notification`, `PasswordResetToken`.

## Convenciones

- IDs `cuid`, timestamps `createdAt`/`updatedAt`.
- Relaciones con borrado en cascada cuando el padre define el ciclo de vida.
- Enums como `Role`, `PlayerStatus`, `OpportunityType`, `PaymentStatus`.
- Acceso solo desde `packages/database` (singleton de `PrismaClient`).

## Migraciones

- Desarrollo: `pnpm db:migrate` (prisma migrate dev).
- Script de despliegue: `pnpm scripts:migrate` (migrate deploy).
- Verificación: `pnpm scripts:verify`.
