# Especificación del producto

## Funcionalidades por área

### Autenticación y cuentas
- Registro por rol con onboarding específico (jugador, familiar, entrenador, agente, club).
- Login con credenciales, recuperación y restablecimiento de contraseña.
- Sesiones JWT con rol embebido y guards por área.

### Jugador
- Profile completo (ficha futbolística, datos físicos, biografía).
- Videos con reproductor y subida.
- Biblioteca de entrenamiento por categorías (técnica, fuerza, psicología).
- Development pathway (pathway), objetivos y evaluaciones.
- Exploración y solicitud de oportunidades con seguimiento de estado.
- Notificaciones y ajustes de cuenta.

### Club
- Gestión de perfil y verificación.
- Publicación de oportunidades y requisitos de jugadores.
- Búsqueda y ficha de jugadores disponibles.
- Recepción y respuesta de consultas.
- Matching con requisitos y score explicado.
- Gestión de staff.

### Agente
- Representación de jugadores (añadir por email).
- Submissions a clubes con pipeline: envío → prueba → negociación → contrato.
- Detalle de cada etapa (fechas, ofertas, salarios, estado).

### Ojeador
- Búsqueda de jugadores disponibles, guardado de favoritos.
- Informes de scouting con valoración, fortalezas y debilidades.

### Administration
- Gestión de usuarios (roles, verificación, eliminación).
- Verificación de jugadores y clubes.
- Supervisión de oportunidades, reclutamiento, membresías, pagos y analíticas.

## Fases de construcción
1. Esqueleto y estructura. 2. Autenticación y onboarding. 3. Área jugador.
4. Reclutamiento (club/agente/ojeador). 5. Matching, membresías y administración.
6. Worker, tests, documentación e infraestructura.
