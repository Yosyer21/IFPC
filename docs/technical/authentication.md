# Autenticación

**Auth.js v5** (NextAuth) with JWT strategy in `packages/auth`.

## Flujo

1. **Login**: el provider `credentials` valida email + contraseña (bcrypt) contra `User`.
2. **Sesión JWT**: el token contiene `id`, `role` y datos básicos del usuario.
3. **Middleware** (edge): decodifica el token con `getToken` (`@ifpc/auth/edge`) y protege `/dashboard`.
4. **Guard por rol**: `/dashboard/<rol>` solo es accesible para ese rol (redirección si no corresponde).
5. **Dashboard layout**: verifica la sesión en servidor antes de renderizar.

## Passwords

- Hash con **bcryptjs** (10 rondas) en `packages/auth/src/password.ts`.
- Recuperación: token aleatorio (sha256) con expiración de 1h en `PasswordResetToken`.

## Ficheros clave

- `packages/auth/src/auth.ts` — instancia NextAuth + provider credentials.
- `packages/auth/src/auth.config.ts` — config base (edge-safe).
- `packages/auth/src/edge.ts` — helpers seguros para edge (getToken, permisos).
- `apps/web/app/api/auth/[...nextauth]/route.ts` — handlers GET/POST.

> Pendiente: verificación de email y envío real de correos (Resend).
