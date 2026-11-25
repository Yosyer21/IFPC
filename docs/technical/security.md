# Security

## Applied practices

- **Passwords**: bcryptjs (10 rondas); nunca en texto plano. No se exponen en APIs.
- **Sesiones**: JWT firmado con `AUTH_SECRET`; rol embebido y cookie segura de Auth.js.
  El rol se refresca desde la BD cada 15 min (bajas/degradaciones no esperan 30 días);
  un token sin `id` se rechaza en middleware y APIs.
- **Guard por rol** en middleware + verificación en layout y acciones.
- **Validación**: zod en el borde (Server Actions) antes de tocar la BD.
- **Inquiries**: Prisma parametrizado; filtros por propietario para evitar IDOR.
- **Secretos**: fuera del repo (`.env` gitignored); `.env.example` con placeholders.
- **Uploads públicos** (avatares/portadas): nombres aleatorios y extensión permitida.

### APIs (2026-11)

- Selects seguros en `apps/web/lib/api/user-select.ts`: `passwordHash` **nunca** sale
  de una API; `publicUserSelect` no incluye email.
- `/api/users` y `/api/parents` solo ADMIN; `/api/players` exige rol PLAYER para
  editar y filtra el directorio por los interruptores del padre.
- Todos los `findMany` de `/api` tienen `take`.
- **CSRF**: middleware bloquea mutaciones `/api/*` con `Origin` distinto de `Host`;
  checkout y escrituras tienen además `isSameOrigin`. Webhooks validan firma Stripe.
- Webhook Stripe **idempotente** por `stripePaymentIntentId`; solo activa membresías con
  `payment_status = paid`.
- Tokens de verificación/recuperación nunca se registran ni se devuelven en producción.
- Checkout limitado a 5 intentos/min por usuario.
- `/api/health` no expone secretos.

### Documentos

- Subida **privada** en `PRIVATE_UPLOAD_DIR` (por defecto `.private-uploads/`, fuera
  de `public/`), nunca URL estática.
- Validación servidor: PDF/JPG/PNG/WebP, 10 MB y **magic bytes**.
- Descarga en `GET /api/documents/[documentId]/file` con `attachment`, `nosniff`,
  `no-store` y autorización: dueño, padre vinculado, admin, club/staff verificado,
  universidad/colegio verificado, coach verificado o agente con relación activa.
- `/api/files` ya no redirige ficheros privados a `/uploads` en el driver local.
- Avatares remotos: solo hosts `*.googleusercontent.com`, HTTPS, sin redirects, 2 MB
  y MIME de imagen (anti-SSRF).
- Migración de documentos antiguos: `pnpm scripts:migrate-documents -- --apply`.

### Cabeceras y abuso

- `next.config.mjs`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, COOP y HSTS en producción; `x-powered-by` apagado.
- Login/registro/recuperación: rate limit en memoria (10/15 min por IP+email,
  5 altas/hora, 5 recuperaciones/15 min). El endpoint directo de credenciales de
  Auth.js también se limita por IP (20/min) en el middleware.
- Índices nuevos: `Application(parentApproval,status)`,
  `Trial(playerId,parentApproval,status)`, `Negotiation(playerId,parentApproval,status)`,
  `Document(expiresAt)`, `Notification(userId,createdAt)`, `Payment(userId,createdAt)`,
  `Application(playerId,createdAt)`, `Application(opportunityId,createdAt)` y
  `Document(playerId,createdAt)`.

## Pendientes / recomendaciones

- Rate limiting **distribuido** (Redis/Upstash) y bloqueo temporal de cuenta.
- Exigir email verificado antes de login (decisión de producto).
- MFA para ADMIN y personal de club.
- CSP con nonce (quitar `unsafe-inline`/`unsafe-eval`).
- Auditoría de acciones sensibles (modelo `Audit`) y de dependencias (`pnpm audit`).
- Escaneo antivirus de documentos y bucket S3 privado con URLs firmadas cortas.
- Tests de integración de autorización por rol para cada ruta API.
