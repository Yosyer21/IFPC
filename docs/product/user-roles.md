# Roles de usuario

| Rol | Descripción | Acceso principal |
| --- | --- | --- |
| **Jugador** | Futbolista que construye su perfil y busca oportunidades | `/dashboard/player` |
| **Familiar** | Padre/madre/tutor que acompaña el desarrollo | `/dashboard/parent` |
| **Entrenador** | Técnico que evalúa y guía jugadores | `/dashboard/coach` |
| **Ojeador** | Profesional que descubre y reporta talento | `/dashboard/scout` |
| **Agente** | Representante legal de jugadores | `/dashboard/agent` |
| **Club** | Entidad que publica oportunidades y recluta | `/dashboard/club` |
| **Universidad** | Institución académico-deportiva | `/dashboard/university` |
| **Administrador** | Gestión global de la plataforma | `/dashboard/admin` |

## Permisos

- El guard por rol se aplica en el middleware (`/dashboard/<rol>` solo para ese rol).
- La sesión JWT contiene el rol; los cambios de rol los gestiona el administrador.
