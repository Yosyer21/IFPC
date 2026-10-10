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
- **Compositor simple**: de entrada solo el texto y la barra de acciones; el resto
  se despliega cuando hace falta —adjuntar **foto o vídeo**, **galería** de hasta
  cuatro imágenes con **texto alternativo** (accesibilidad), **encuesta** (2 a 4
  opciones), **programación** (sale sola a su hora) o el bloque **«Más opciones»**
  (título, enlace, vídeo de YouTube/Vimeo, etiquetas, quién puede comentar y
  tipo)—. Las **menciones** `@perfil` aparecen como sugerencias al escribir la
  arroba (con aviso a quien mencionas) y los **borradores** se guardan con un
  botón, sin salir del feed.
- **Vídeos con portada**: al subir un vídeo se le extrae un fotograma que se
  muestra antes de darle al play (y que se usa como imagen al compartir el
  enlace), en vez del rectángulo negro de antes.
- **Interacción**: me gusta **al instante** (sin esperar al servidor), comentarios
  con **respuestas y edición** del propio texto, compartir (copia el enlace
  directo de la publicación) y denunciar.
- **Privacidad y convivencia**: cualquier perfil puede **seguir**, **silenciar**
  (deja de ver sin avisar) o **bloquear** (ninguno de los dos se ve ni puede
  interactuar, y se cancelan los seguimientos) a cualquier otro, y cada
  publicación decide **quién puede comentarla** (cualquiera, solo quien me sigue
  o nadie).
- **«No me interesa»**: de cada publicación puedes quitarla de **tu** feed sin
  afectar a nadie más (ni al autor ni a los demás). Se deshace desde el detalle
  de la publicación, que sigue siendo accesible.
- **Avisos**: bandeja con contador en el sidebar para **todos los perfiles**, con
  avisos **agrupados** ("A 3 personas les gusta tu publicación") y aviso correcto
  al autor de la publicación o a quien escribió el comentario que respondes.
- **Red social (F2)**: **seguir y dejar de seguir** cualquier perfil, pestaña
  **Siguiendo** (lo que publican los perfiles que sigues más lo tuyo), contador
  de seguidores/siguiendo en cada muro, aviso al recibir un seguidor nuevo y
  bloque de **perfiles sugeridos** (los más seguidos que aún no sigues).
- **Pestaña Para ti (F2)**: ordena el feed con el **motor de matching** que ya
  usan las oportunidades (ver más abajo).
- **Lectura fluida**: "Ver más" carga la página siguiente **sin recargar** (y sin
  perder el scroll), y el me gusta no espera al servidor.
- **Convivencia**: topes anti-abuso (ritmo de publicación y comentario, enlaces
  por texto y duplicados recientes) y moderación automática del lenguaje no
  permitido, que deja la publicación **en revisión** en vez de borrarla.
- **Exploración**: pestañas _Para ti · Siguiendo · **Perfiles** · Recientes ·
  Tendencias · Anuncios · Vídeos_, **buscador combinable** (texto, tipo de
  publicación y rol del autor) con filtro por etiqueta (`#sub17`), **directorio de
  perfiles** para encontrar a quién seguir y paginación por cursor.
- **Métricas del autor**: cada publicación muestra a su autor cuántas personas
  distintas la han abierto (y cuántas aperturas anónimas llegan desde la web
  pública), y el panel **Mi rendimiento** añade alcance total, engagement, las
  publicaciones con más interacción, las etiquetas que mejor funcionan y la mejor
  hora para publicar. El admin tiene además la **salud del feed** (actividad,
  autores, etiquetas, denuncias y tiempo medio de resolución).
- **Moderación (F3)**: el autor edita y borra lo suyo; el autor de una publicación
  puede borrar comentarios de su hilo; `ADMIN` puede ocultar/republicar, **fijar
  en el feed**, borrar y **atender denuncias** desde el panel
  `/dashboard/admin/discovery`, que además muestra la **traza** de todo lo hecho
  (quién, qué publicación, cuándo).
- **Búsqueda y fijados (F3)**: buscador por texto (título, cuerpo **y nombre del
  autor**) que convive con pestañas y etiquetas, y publicaciones **fijadas** por
  un admin, que aparecen destacadas al principio del feed con la etiqueta
  _Fijado_ y sin duplicarse en el listado.

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

- `/discovery` — feed público (pestañas _Recientes · Tendencias · Anuncios ·
  Vídeos_, buscador, etiquetas y publicaciones fijadas) con un aviso de que está
  en modo lectura y CTAs a _Crear cuenta_ / _Entrar_.
- `/discovery/<postId>` — publicación y sus comentarios, sin caja de comentario.
- `/discovery/u/<userId>` — muro del autor con sus contadores, sin botón de seguir.
- `/discovery/tag/<tag>` — redirige al feed filtrado.

En público **no** hay _Para ti_ ni _Siguiendo_ (hacen falta saber quién mira), no
se puede dar me gusta, comentar, denunciar ni reportar, y **no se cuentan vistas**
(el alcance mide espectadores identificables). Todo el contenido publicado es
visible: no hay contenido restringido ni se filtra por edad.

## Qué NO hace (todavía)

- Almacenamiento en S3 con URLs firmadas (hoy las subidas viven en el sistema de
  ficheros, ver `docs/technical/storage.md`).
