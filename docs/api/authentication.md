# API · Autenticación

## Endpoints (Route Handlers)

| Método | Ruta | Description |
| --- | --- | --- |
| GET/POST | `/api/auth/[...nextauth]` | Handlers de Auth.js (login con credentials, sesión) |

## Flujo de sesión

- El login se realiza mediante la **Server Action** `loginAction` (credentials provider).
- La sesión JWT contiene `id` y `role`; se lee en servidor con `auth()`.
- El middleware protege `/dashboard` y aplica el guard por rol.

## Recuperación de contraseña

- `forgotPasswordAction` genera un token (expiración 1h) y devuelve el enlace (consola en desarrollo).
- `resetPasswordAction` valida el token (hash sha256), actualiza la contraseña y lo marca usado.

> Ver `docs/technical/authentication.md`.
