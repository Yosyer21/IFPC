# Database

Motor: **PostgreSQL** vía **Prisma ORM** (`packages/database/prisma/schema.prisma`).

## Main models

- **Cuentas**: `User` (rol, hash de contraseña), `Player`, `Parent`, `Coach`, `Scout`, `Agent`, `Club`, `University`, `Academy`, `ClubStaff`.
- **Desarrollo**: `TrainingContent`, `Pathway`, `PlayerGoal`, `Evaluation`, `CareerEntry` (trayectoria: club, categoría y estadísticas por temporada), `Document`.
- **Video**: `Video` (estado: uploading/processing/ready/failed).
- **Opportunities**: `Opportunity`, `Application`.
- **Reclutamiento**: `Submission`, `Trial`, `Negotiation`, `Contract` (pipeline enlazado).
- **Scouting**: `ScoutingReport`, `SavedPlayer`.
- **Contacto**: `Inquiry`, `Requirement`.
- **Negocio**: `Membership`, `Payment`.
- **Sistema**: `Notification`, `PasswordResetToken`.
- **Métricas**: `ProfileView` (visitas de terceros al perfil de un jugador: visitante, su rol,
  contador de visitas y fechas de primera/última visita).
- **Discovery** (feed social interno): `Post` (autor de cualquier rol, tipo, estado, texto,
  medio, etiquetas y oportunidad compartida), `PostLike`, `PostComment` (un nivel de
  respuestas), `PostView` (alcance por espectador, mismo patrón que `ProfileView`),
  `PostReport` (con `resolvedAt` y `ModerationLog` para la traza) y `Follow`. Ver
  `docs/technical/discovery.md`.

## Convenciones

- IDs `cuid`, timestamps `createdAt`/`updatedAt`.
- Relaciones con borrado en cascada cuando el padre define el ciclo de vida.
- Enums como `Role`, `PlayerStatus`, `OpportunityType`, `PaymentStatus`.
- Acceso solo desde `packages/database` (singleton de `PrismaClient`).
- El cliente es **perezoso**: importar el módulo no abre ninguna conexión. Es lo que evita que
  `next build` (que evalúa las páginas en varios workers) abra varias instancias de PGlite a la
  vez y corrompa el directorio de datos embebido.

## Migraciones

- Desarrollo: `pnpm db:migrate` (prisma migrate dev).
- Script de despliegue: `pnpm scripts:migrate` (migrate deploy).
- Verificación: `pnpm scripts:verify`.
- **PGlite local**: `pnpm scripts:apply-delta [ref]` aplica a la base embebida el delta SQL
  entre el esquema del árbol de trabajo y otra versión (por defecto `HEAD`), sin recrearla.
- **PGlite, un solo proceso**: con `USE_PGLITE=true` la base embebida no admite dos
  procesos a la vez. Antes de lanzar un script (`pnpm scripts:*`, `pnpm db:seed`) hay que
  parar `pnpm dev`; si no, la segunda apertura falla con `RuntimeError: Aborted()`.
- **Si PGlite no arranca**: un proceso que murió a mitad de escritura deja
  `.pglite/postmaster.pid`. Si no hay ningún dev/script activo, bórralo y vuelve a
  arrancar; si el directorio quedó inconsistente, se rehace con `pnpm db:setup-pglite`
  (aplica el esquema completo y carga los datos demo).
- **Nota**: `prisma/migrations` está vacío (no hay historial), así que `migrate deploy` no
  reconstruye el esquema desde cero. Mientras siga así, cualquier cambio de esquema —como los
  modelos de Discovery— se aplica en local con `scripts:apply-delta` y en producción con
  `prisma db push`; crear una migración suelta que contenga solo las tablas nuevas daría un
  `migrate deploy` incompleto.
