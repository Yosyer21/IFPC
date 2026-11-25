# Parent approvals

Aprobación del padre para pruebas y ofertas antes de que cuenten (libro §2).

## Regla

`needsParentApproval(dateOfBirth, parentLinks)` (`apps/web/lib/minor.ts`):
`true` solo si el jugador es **menor de 16** y tiene al menos un padre vinculado.
Sin vínculo no hay a quién pedir la aprobación: se valida al vincular.

## Datos

`Trial` y `Negotiation` añaden:

- `parentApproval`: `NOT_REQUIRED` | `PENDING` | `APPROVED` | `DECLINED`;
- `parentDecisionAt` y `parentDecisionByUserId` (auditoría).

## Flujo

1. El club invita desde Find players (`invitePlayerToTrialAction`).
   - Si el jugador es menor de 16 con padre: la prueba se crea con
     `parentApproval = PENDING`; el jugador recibe “waiting for your parent” y el
     padre un aviso que abre `/dashboard/parent/approvals`.
   - Si no: `NOT_REQUIRED` (comportamiento anterior).
2. El padre decide en `/dashboard/parent/approvals`:
   - **Approve**: `APPROVED`; la prueba aparece en el calendario del jugador.
   - **Decline**: `DECLINED` + `status = CANCELLED` (prueba) o `REJECTED` (oferta).
   - Se notifica al jugador y al club.
3. Solo las pruebas `NOT_REQUIRED`/`APPROVED` se pintan en el calendario del
   jugador/padre (`lib/calendar.ts`).
4. Find players muestra **Waiting for parent** mientras está pendiente y no
   permite duplicar la invitación.

## Dónde

- Bandeja: `/dashboard/parent/approvals` (pruebas, ofertas y decisiones recientes).
- Navegación del padre + acción pendiente en el dashboard.
- Seed: `trial-player-1` y `neg-parent-1` quedan pendientes para el usuario
  `parent@demo.com`.

## Becas

`Application` añade los mismos campos (`parentApproval`, `parentDecisionAt`,
`parentDecisionByUserId`):

1. La universidad/colegio pulsa **Offer place** en el detalle de la beca.
   - Menor de 16 con padre → estado `PENDING` + `parentApproval = PENDING`; se avisa
     al jugador y al padre (`/dashboard/parent/approvals`).
   - Resto → `ACCEPTED` directo.
2. El padre aprueba o rechaza en la misma bandeja:
   - **Approve** → `ACCEPTED`.
   - **Decline** → `REJECTED`.
3. **Decline** directo de la organización → `REJECTED`.
4. La lista de postulantes muestra **Waiting for parent** y el Transfer Window del
   jugador añade la misma etiqueta en “My applications”.

## Pendiente

- Incluir al padre en chats/reuniones de menores de 16 (la inclusión en reservas,
  pruebas, ofertas y becas ya está hecha).
