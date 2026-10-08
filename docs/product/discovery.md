# Discovery

Red social **interna** de Future Baller: un único feed que ven y alimentan
**todos los perfiles** de la plataforma. Sustituye la idea de "muro" por perfil
(jugador, club, universidad, escuela, entrenador, ojeador, agente, familia,
admin) por un espacio común donde publicar y descubrir oportunidades, vídeos y
logros.

## Alcance (F1)

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
- **Exploración**: pestañas *Recientes · Tendencias · Anuncios · Vídeos*, filtro
  por etiqueta (`#sub17`) y paginación por cursor.
- **Métricas del autor**: cada publicación muestra a su autor cuántas personas
  distintas la han abierto y el desglose por rol (mismo criterio que las
  visitas al perfil de jugador).
- **Moderación**: el autor edita y borra lo suyo; el autor de una publicación
  puede borrar comentarios de su hilo; `ADMIN` puede ocultar y volver a publicar
  cualquier contenido, además de borrarlo.

## Flujos

1. Entrar en **Discovery** desde el sidebar de cualquier área (primera sección).
2. Publicar desde el compositor de la propia página del feed.
3. Abrir una publicación (enlace directo `/dashboard/discovery/<postId>`) para
   comentar, ver el alcance (si es tuya) o editar el texto (si es tuya).
4. Tocar el nombre o el avatar de un autor para ver su muro
   (`/dashboard/discovery/u/<userId>`).
5. Tocar una etiqueta para filtrar el feed por `#etiqueta`.

## Qué NO hace (todavía)

- Seguir/dejar de seguir perfiles y feed "siguiendo" (F2).
- Feed personalizado por matching y avisos de seguidor (F2).
- Panel de moderación con reportes, destacar/fijar, búsqueda por texto (F3).
- Versión pública indexable y almacenamiento en S3 (F3).
