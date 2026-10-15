# Autenticación

**Auth.js v5** (NextAuth) with JWT strategy in `packages/auth`.

## Flujo

1. **Login**: el provider `credentials` valida email + contraseña (bcrypt) contra `User`.
2. **Sesión JWT**: el token contiene `id`, `role` y datos básicos del usuario.
3. **Middleware** (edge): decodifica el token con `getToken` (`@ifpc/auth/edge`) y protege `/dashboard`.
4. **Guard por rol**: `/dashboard/<rol>` solo es accesible para ese rol (redirección si no corresponde).
5. **Dashboard layout**: verifica la sesión en servidor antes de renderizar. Si la cuenta
   todavía no ha elegido tipo de cuenta (`onboardedAt` nulo) redirige a `/welcome`.

## Alta e inicio de sesión con Google

Opcional: se activa con **`AUTH_GOOGLE_ID`** y **`AUTH_GOOGLE_SECRET`** (Auth.js v5 las
detecta por el nombre). `isGoogleEnabled()` (`packages/auth/src/google.ts`) decide con las
dos: sin ellas el provider no se registra, el botón no se muestra y todo funciona con
email. Se comprueba con `GET /api/auth/providers` (debe aparecer `google`).

Las credenciales se crean en **Google Cloud Console** (sección _Google Auth Platform_;
el menú antiguo _APIs & Services → Credentials_ redirige ahí):

1. Crea/elige un proyecto y pulsa **Get started**: nombre de la app (p. ej. _Future
   Baller_), email de soporte, público **External** y acepta la política. Eso registra la
   pantalla de consentimiento (secciones _Branding_ y _Audience_).
2. **Clients → Create client → application type _Web application_**:
   - _Authorized JavaScript origins_: `http://localhost:3000` (+ el dominio de producción).
   - _Authorized redirect URIs_: `http://localhost:3000/api/auth/callback/google` (+
     `https://<dominio>/api/auth/callback/google`).
   - El _client secret_ solo se muestra al crearlo: cópialo o descarga el JSON.
   - Scopes: `openid`, `email`, `profile` (no requieren revisión de Google).
3. **Audience → Test users**: mientras la app esté en _Testing_ solo esas cuentas pueden
   entrar; añade tu email para probar. Para abrirla a todo el mundo, **Publish app**.

Las dos variables van en **`apps/web/.env.local`** (es el fichero que carga Next.js; el
`.env` de la raíz lo leen los scripts de CLI) y hay que **reiniciar `pnpm dev`**.

Como las sesiones son JWT y **no hay adaptador de Prisma**, el callback `signIn` de
`packages/auth/src/auth.ts` resuelve la cuenta:

- **email nuevo** → crea el `User` (con `emailVerified`, porque Google solo devuelve
  direcciones verificadas) y **sin perfil de rol** (`onboardedAt` nulo);
- **email existente y verificado** → se vincula;
- **email existente sin verificar** → no se vincula: se le pide entrar con su contraseña
  (si no, alguien que se registró con un correo ajeno sin verificar perdería la cuenta).

Después del consentimiento, `/welcome` pide el **tipo de cuenta** (solo jugador,
entrenador y club: `SIGNUP_ROLE_OPTIONS` en `@ifpc/config`), crea el perfil con
`createRoleProfile` (`apps/web/lib/signup.ts`), marca `onboardedAt`, refresca la sesión con
`unstable_update` y entra al dashboard con la **animación de bienvenida**
(`WelcomeOverlay`, una sola vez vía `?welcome=1`).

La foto de Google se copia a `/uploads/photos` (best-effort): si falla, la persona se queda
con sus iniciales y puede subir una desde Ajustes → Account.

## Passwords

- Hash con **bcryptjs** (10 rondas) en `packages/auth/src/password.ts`.
- Recuperación: token aleatorio (sha256) con expiración de 1h en `PasswordResetToken`.
- Las cuentas creadas con Google no tienen contraseña: pueden **crear una** desde
  Ajustes → Account.

## Ficheros clave

- `packages/auth/src/auth.ts` — instancia NextAuth + providers (credentials y Google) y
  resolución de la cuenta en `signIn`/`jwt`.
- `packages/auth/src/auth.config.ts` — config base (edge-safe).
- `packages/auth/src/edge.ts` — helpers seguros para edge (getToken, permisos).
- `packages/auth/src/roles.ts` — roles y guardas de rol.
- `apps/web/app/api/auth/[...nextauth]/route.ts` — handlers GET/POST.
- `apps/web/lib/signup.ts` — perfil por tipo de cuenta y avatar remoto.
- `apps/web/app/(auth)/welcome/page.tsx` + `apps/web/components/dashboard/welcome-overlay.tsx`
  — último paso del alta con Google y animación de bienvenida.

> Pendiente: 2FA y gestión de sesiones/dispositivos (ver `docs/technical/security.md`).
