# Discovery

Red social **interna** de Future Baller: un único feed que ven y alimentan
**todos los perfiles** de la plataforma. Sustituye la idea de "muro" por perfil
(jugador, club, universidad, escuela, entrenador, ojeador, agente, familia,
admin) por un espacio común donde publicar y descubrir oportunidades, vídeos y
logros.

## Alcance (F1 + F2)

- **Visible por cualquier perfil con sesión** (`/dashboard/discovery`). No hay
  versión pública/anónima todavía; el acceso exige cuenta y sesión.
- **Publica cualquier rol** (`POSTING_ROLES` en `packages/config/src/discovery.ts`).
- **Tipos de publicación**: anuncio, logro, foto y vídeo. El tipo se deduce del
  medio adjunto (una imagen se publica como Foto y un vídeo como Vídeo), de modo
  que no existen publicaciones de vídeo sin vídeo.
- **Contenido**: texto (con `#etiquetas`), título y enlace opcionales, imagen o
  vídeo propio (subido) o **vídeo externo de YouTube/Vimeo**, y compartir una
  **oportunidad** ya existente sin duplicarla.
- **Interacción**: me gusta, comentarios (con un nivel de respuestas), compartir
  (copia el enlace directo de la publicación) y denunciar.
- **Red social (F2)**: **seguir y dejar de seguir** cualquier perfil, pestaña
  **Siguiendo** (lo que publican los perfiles que sigues más lo tuyo), contador
  de seguidores/siguiendo en cada muro, aviso al recibir un seguidor nuevo y
  bloque de **perfiles sugeridos** (los más seguidos que aún no sigues).
- **Pestaña Para ti (F2)**: ordena el feed con el **motor de matching** que ya
  usan las oportunidades (ver más abajo).
- **Exploración**: pestañas *Para ti · Siguiendo · Recientes · Tendencias ·
  Anuncios · Vídeos*, filtro por etiqueta (`#sub17`) y paginación por cursor.
- **Métricas del autor**: cada publicación muestra a su autor cuántas personas
  distintas la han abierto y el desglose por rol (mismo criterio que las
  visitas al perfil de jugador).
- **Moderación (F3)**: el autor edita y borra lo suyo; el autor de una publicación
  puede borrar comentarios de su hilo; `ADMIN` puede ocultar/republicar, **fijar
  en el feed**, borrar y **atender denuncias** desde el panel
  `/dashboard/admin/discovery`, que además muestra la **traza** de todo lo hecho
  (quién, qué publicación, cuándo).
- **Búsqueda y fijados (F3)**: buscador por texto (título, cuerpo **y nombre del
  autor**) que convive con pestañas y etiquetas, y publicaciones **fijadas** por
  un admin, que aparecen destacadas al principio del feed con la etiqueta
  *Fijado* y sin duplicarse en el listado.

## Significado de "Para ti"

No es un algoritmo opaco: usa el motor de matching existente y lo explica con un
badge (`82% match`) en las publicaciones que encajan.

- Un **jugador** ve primero las publicaciones que comparten una oportunidad con
  la que encaja su perfil (posición, edad, nivel, disponibilidad, nacionalidad).
- Un **club o universidad** ve primero las publicaciones de los **jugadores** que
  encajan con sus oportunidades abiertas (justo lo contrario: le sirve para
  reclutar).
- El resto de perfiles (familias, entrenadores, ojeadores, escuelas, admin) ven
  el feed reciente: no se inventa una relevancia que no se puede calcular.

## Flujos

1. Entrar en **Discovery** desde el sidebar de cualquier área (primera sección).
2. Publicar desde el compositor de la propia página del feed.
3. Abrir una publicación (enlace directo `/dashboard/discovery/<postId>`) para
   comentar, ver el alcance (si es tuya) o editar el texto (si es tuya).
4. Tocar el nombre o el avatar de un autor para ver su muro
   (`/dashboard/discovery/u/<userId>`).
5. Tocar una etiqueta para filtrar el feed por `#etiqueta`.

## Espejo público (`/discovery`)

La misma página, **sin sesión y en solo lectura**, para que el contenido se pueda
compartir, encontrar en buscadores y servir de puerta de entrada al registro:

- `/discovery` — feed público (pestañas *Recientes · Tendencias · Anuncios ·
  Vídeos*, buscador, etiquetas y publicaciones fijadas) con un aviso de que está
  en modo lectura y CTAs a *Crear cuenta* / *Entrar*.
- `/discovery/<postId>` — publicación y sus comentarios, sin caja de comentario.
- `/discovery/u/<userId>` — muro del autor con sus contadores, sin botón de seguir.
- `/discovery/tag/<tag>` — redirige al feed filtrado.

En público **no** hay *Para ti* ni *Siguiendo* (hacen falta saber quién mira), no
se puede dar me gusta, comentar, denunciar ni reportar, y **no se cuentan vistas**
(el alcance mide espectadores identificables). Todo el contenido publicado es
visible: no hay contenido restringido ni se filtra por edad.

## Qué NO hace (todavía)

- Almacenamiento en S3 con URLs firmadas (hoy las subidas viven en el sistema de
  ficheros, ver `docs/technical/storage.md`).
