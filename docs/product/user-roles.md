# User roles

| Rol | Description | Acceso principal |
| --- | --- | --- |
| **Player** | Footballer who builds their profile and looks for opportunities | /dashboard/player |
| **Parent** | Padre/madre/tutor que acompaña el desarrollo | `/dashboard/parent` |
| **Coach** | Técnico que evalúa y guía jugadores | `/dashboard/coach` |
| **Scout** | Profesional que descubre y reporta talento | `/dashboard/scout` |
| **Agent** | Representante legal de jugadores | `/dashboard/agent` |
| **Club** | Entidad que publica oportunidades y recluta | `/dashboard/club` |
| **University** | Institución académico-deportiva | `/dashboard/university` |
| **Admin** | Gestión global de la plataforma | `/dashboard/admin` |

## Permisos

- El guard por rol se aplica en el middleware (`/dashboard/<rol>` solo para ese rol).
- La sesión JWT contiene el rol; los cambios de rol los gestiona el administrador.
