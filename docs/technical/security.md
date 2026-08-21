# Seguridad

## Prácticas aplicadas

- **Contraseñas**: bcryptjs (10 rondas); nunca en texto plano.
- **Sesiones**: JWT firmado con `AUTH_SECRET`; rol embebido.
- **Guard por rol** en middleware + verificación en layout y acciones.
- **Validación**: zod en el borde (Server Actions) antes de tocar la BD.
- **Consultas**: Prisma parametrizado; filtros por propietario para evitar IDOR.
- **Secretos**: fuera del repo (`.env` gitignored); `.env.example` con placeholders.
- **Uploads**: nombres aleatorios (`randomUUID`) y extensión permitida.

## Pendientes / recomendaciones

- Rate limiting en login (ya existe `lib/security/rate-limit.ts` de scaffold).
- Headers de seguridad (CSP, HSTS) en producción.
- Auditoría de acciones sensibles (modelo `Audit`).
- Escaneo de dependencias en CI (supply-chain).
