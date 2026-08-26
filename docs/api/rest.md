# API REST · Referencia

Todas las rutas viven en `apps/web/app/api/**`. Autenticación: sesión Auth.js (cookie),
exigida en todas las rutas. JSON responses `{ ok: true, ... }` or `{ ok: false, error }`.

Códigos: `401` sin sesión · `403` rol sin permiso · `400` body inválido · `405` método no permitido.

## Listado de endpoints

| Método | Ruta | Acceso | Description |
| --- | --- | --- | --- |
| GET | `/api/auth` | autenticado | Info de la sesión actual |
| GET | `/api/users` | admin | Lista de usuarios |
| GET | `/api/players` | jugador → propio · admin → todos · resto → directorio | Profilees |
| POST | `/api/players` | jugador | Upsert del propio perfil deportivo (reemplaza campos) |
| GET | `/api/clubs` | club → propio · admin → todos · resto → verificados | Clubes |
| POST | `/api/clubs` | admin | Crea club |
| GET | `/api/opportunities` | club/universidad → suyas · resto → abiertas | Oportunidades |
| POST | `/api/opportunities` | club/universidad/admin | Publica oportunidad |
| GET | `/api/applications` | jugador → suyas · club → recibidas · admin → todas | Applications |
| POST | `/api/applications` | jugador | Envía solicitud (upsert) |
| GET | `/api/notifications` | autenticado | Propias (50) + contador sin leer |
| POST | `/api/notifications` | autenticado | Marca todas como leídas |
| GET | `/api/analytics` | admin | Conteos globales + ingresos |
| GET | `/api/evaluations` | jugador → suyas · coach → de sus jugadores · admin → todas | Evaluaciones |
| GET | `/api/videos` | jugador → suyos · admin → todos | Videos |
| GET | `/api/media` | ídem videos | Alias media |
| GET | `/api/documents` | jugador → suyos · admin → todos | Documentos |
| GET | `/api/training` | autenticado | Catálogo de entrenamiento |
| GET | `/api/parent-education` | autenticado | Guides for families |
| GET | `/api/development` | jugador → suyo · coach → de sus jugadores · admin → todos | Ruta+objetivos+evals |
| GET | `/api/pathways` | jugador → suya · parent → de hijos · admin → todas | Rutas |
| GET | `/api/camps` | admin → todos · resto → abiertos/llenos | Camps |
| POST | `/api/camps` | admin | Crea camp |
| GET | `/api/live-sessions` | jugador → suyas+grupales · coach → suyas · admin → todas | Sesiones |
| POST | `/api/live-sessions` | admin/coach | Crea sesión |
| GET | `/api/matching` | rol-aware | Scores del motor `@ifpc/matching` |
| GET | `/api/memberships` | autenticado | Membership + pagos propios |
| GET | `/api/payments` | autenticado | Payments propios |
| POST | `/api/payments/checkout` | autenticado | Crea Checkout Session de Stripe para una membresía (`tier: PREMIUM\|SCOUT\|CLUB`) → `{ url }`. 503 si Stripe no configurado |
| GET | `/api/submissions` | agente → suyos · club → suyos · admin → todos | Submissions |
| GET | `/api/trials` | club → suyas · jugador → suyas · admin → todas | Pruebas |
| GET | `/api/contracts` | club → suyos · admin → todos | Contratos |
| GET | `/api/negotiations` | club → suyas · admin → todas | Negociaciones |
| GET | `/api/scouting` | scout → suyos · admin → todos | Informes |
| POST | `/api/scouting` | scout | Crea informe (rating 1-10) |
| GET | `/api/scouts` · `/api/agents` · `/api/coaches` · `/api/parents` · `/api/universities` · `/api/academies` | autenticado | Directorios |
| POST | `/api/academies` | admin | Crea academia |
| POST | `/api/webhooks` | público | Webhooks Stripe: verifica firma `Stripe-Signature` y procesa `checkout.session.completed` (Payment + Membership). 400 sin firma válida |

Helpers compartidos: `apps/web/lib/api/respond.ts` (`requireUser`, `forbidden`, `badRequest`,
`methodNotAllowed`, `readJson`, `stringField`, `intField`, `dateField`).

> Nota: `POST /api/players` reemplaza el perfil completo; envía todos los campos que quieras conservar.
