# API · Clubes

## Conceptos

- **Club**: entidad con perfil, país, ciudad, liga y estado de verificación.
- **Oportunidad**: oferta publicada (tipo, posición, edad, ubicación, cierre).
- **Requisito**: perfil buscado para matching.
- **Consulta** (Inquiry): mensaje recibido de familias/jugadores.
- **Staff**: miembros del club con rol.

## Acciones principales

| Acción | Implementación |
| --- | --- |
| Publicar oportunidad | `createOpportunityAction` (zod) |
| Crear requisito | `createRequirementAction` |
| Cerrar requisito | `closeRequirementAction` |
| Responder consulta | `respondInquiryAction` (cierra con respuesta) |
| Invitar staff | `inviteStaffAction` (por email de usuario existente) |

## Verificación

- Admin: `verifyClubAction` marca el club como verificado.
