# Scholarships

Programas de beca (completa, parcial o plaza de internado) de universidades y colegios.

## Modelo

- `Opportunity` (`type = SCHOLARSHIP`) es la pieza que ya alimenta el flujo del jugador:
  matching, postulaciones (`Application`), guardados y notificaciones.
- `Scholarship` es una extensión **1:1** (`opportunityId @unique`) con los datos del
  programa:
  - `coverage`: `FULL` | `PARTIAL` | `BOARDING`;
  - `spots`, `amount` (texto libre), `minGpa` (0–4), `intakeYear`;
  - dueño: `universityId` **o** `schoolId`.
- La oportunidad guarda el mismo dueño y `creatorType` (`UNIVERSITY` | `SCHOOL`) para que
  el Transfer Window la clasifique en la pestaña correcta.
- Los colegios pueden publicar oportunidades desde este módulo (`Opportunity.schoolId`).

## Flujo

- **Universidad/colegio**: `/dashboard/{university,school}/scholarships`
  - formulario `ScholarshipForm` → `createScholarshipAction`: crea oportunidad + programa;
  - tablero con programas abiertos, plazas, postulantes y becados;
  - `[scholarshipId]`: detalle con deadline, GPA, cobertura, plazas y postulantes;
    `toggleScholarshipStatusAction` abre/cierra el programa.
- **Jugador**: la beca aparece en Transfer Window (`matchFromOpportunity` añade el resumen
  `Full scholarship · 2 spots · 100% tuition · Intake 2027`) y en
  `/dashboard/player/opportunities/[id]` con el detalle. Se postula con el formulario
  existente (`applyToOpportunityAction`).
- **Público**: `/opportunities` y el detalle muestran cobertura, plazas, financiación,
  GPA mínimo y curso.
- **Menores de 16**: al pulsar **Offer place**, la postulación queda `PENDING` con
  `parentApproval = PENDING`; el padre decide en `/dashboard/parent/approvals` y solo
  entonces pasa a `ACCEPTED` (o `REJECTED` si rechaza). El detalle de la beca muestra
  **Waiting for parent** y el jugador ve la misma etiqueta en “My applications”.
  Ver `docs/technical/parent-approvals.md`.

## Validación

`packages/validation/src/scholarship.ts` convierte los `input` vacíos a `null`
(plazas/GPA/curso/edades) y limita GPA a 0–4 y plazas a 1–500. Tests en
`tests/unit/scholarships/scholarships.test.ts` y resumen de tarjeta en
`tests/unit/transfer-window/transfer-window.test.ts`.
