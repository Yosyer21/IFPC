# Player journey

1. **Registration**: crear cuenta seleccionando el rol _jugador_.
2. **Onboarding**: completar datos deportivos (posición, pierna, altura, peso, nacionalidad).
3. **Profile**: completar ficha futbolística, física y biografía; añadir club actual y
   **trayectoria** (clubes, categorías y estadísticas por temporada), que se muestra en el
   perfil público para clubes y ojeadores.
4. **Interest**: el perfil muestra quién lo visita (interesados, visitas y desglose por rol),
   registrado cuando un rol profesional abre el perfil de un jugador.
5. **Videos**: subir highlights (almacenamiento local en fase actual).
6. **Training**: seguir contenidos de técnica, fuerza y psicología.
7. **Desarrollo**: revisar la ruta (pathway), objetivos y evaluaciones; monitorizar el progreso.
8. **Opportunities**: explorar ofertas abiertas, enviar solicitudes y seguir su estado.

## Personalización del perfil

El jugador decide cómo se presenta (`/dashboard/player/profile/edit`):

- **Portada** (`Player.bannerUrl`), subida por el driver de almacenamiento
  (`lib/storage`: disco o S3), **titular** (`headline`), **ubicación** (`location`),
  **chips de disponibilidad** (`openTo`: busco club, abierto a pruebas, beca deportiva,
  fútbol universitario, representante) y **color del perfil** (`accentColor`, paleta
  cerrada de cinco acentos).
- La cabecera personalizada aparece en el perfil propio y en el **perfil público**
  (`/players/[playerId]`), y el titular alimenta la descripción para buscadores y redes.
- La tarjeta **«Fuerza del perfil»** pondera 14 señales sobre 100 (`PROFILE_CHECKLIST`) y
  propone un «siguiente mejor paso» con enlace directo donde se completa.

## Perfil como red social

El perfil se lee como una página de red social (panel frontal + panel lateral + muro):

- **Panel frontal** (`components/player/profile-header.tsx`): portada, avatar con el acento,
  titular, ubicación y chips. El dueño puede **cambiar la foto y la portada desde el propio
  panel** (`cover-photo-editor` / `profile-photo-editor`), sin entrar al formulario.
- **Estadísticas** (`lib/player-stats.ts` + `profile-stats.tsx`): nivel global sobre 10,
  partidos, goles, asistencias, temporadas, vídeos y evaluaciones, más el nivel por
  categoría. Se ven en el perfil propio, en el muro de Discovery y en el perfil público.
- **Muro**: las publicaciones del jugador en Discovery aparecen en su perfil
  («Mis publicaciones», con enlace al muro completo y al compositor).
