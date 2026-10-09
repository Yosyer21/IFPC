# Discovery (técnico)

## Modelo de datos

Cuelga de `User` (no de `Player`) para que **cualquier rol** pueda publicar.

| Modelo        | Uso                                                                        |
| ------------- | -------------------------------------------------------------------------- |
| `Post`        | Publicación: `authorId`, `type`, `status`, texto, medio y etiquetas.        |
| `PostLike`    | Un "me gusta" por persona y publicación (`@@unique([postId, userId])`).     |
| `PostComment` | Comentario; `parentId` da un nivel de respuestas (auto-relación).           |
| `PostView`    | Alcance: un registro por publicación + espectador, con contador y fechas.   |
| `PostPollVote` | Voto en la encuesta de una publicación (uno por persona y publicación).    |
| `PostReport`  | Denuncia (una por persona y publicación); `resolvedAt` marca las atendidas.  |
| `ModerationLog` | Traza de moderación: actor, `postId`, acción y notas. `postId` no es relación, para sobrevivir al borrado. |
| `Follow`      | Relación social: `followerId` → `followingId` (cualquier rol sigue a cualquiera). |

Enums: `PostType` (`ANNOUNCEMENT · VIDEO · PHOTO · ACHIEVEMENT`) y `PostStatus`
(`DRAFT · PUBLISHED · HIDDEN`; `HIDDEN` solo lo aplica un admin).

Campos relevantes de `Post`:

- `mediaUrl` + `mediaKind` (`image` | `video` | `embed`). Para los medios
  subidos la URL es `/uploads/posts/<uuid>.<ext>`; para YouTube/Vimeo se guarda
  ya la **URL canónica de incrustación**.
- `linkUrl` (enlace libre) y `opportunityId` (oportunidad compartida).
- `tags String[]` (Postgres `TEXT[]`; se consultan con `tags: { has: tag }`).
- `mediaUrls String[]` + `mediaAlt`: **galería** (hasta cuatro imágenes, la
  primera es también `mediaUrl`) y su **texto alternativo**.
- `pollOptions String[]`: opciones de la **encuesta** (vacío = no hay encuesta);
  los votos viven en `PostPollVote` (`@@unique([postId, userId])`, `optionIndex`).
- `publishAt`: hora a la que debe salir una publicación **programada** (mientras
  no llega se guarda como `DRAFT`).
- `pinnedAt` reservado para destacar publicaciones (F3; hoy no ordena el feed).

`PostView` sigue el patrón de `ProfileView`: el espectador es un `String`, no una
relación, para que borrar un usuario no arrastre métricas.

## Ranking y paginación

`apps/web/lib/discovery.ts` separa lo puro de lo que consulta la base:

- Puro (testeado en `tests/unit/discovery/feed.test.ts` y
  `tests/unit/discovery/composer.test.ts`): `parseFeedFilters`, `extractTags`,
  `extractMentions`, `countPollVotes`, `resolveEmbed`, `engagementScore`,
  `rankTrendingPosts`, `formatRelativeTime`, `summarizePostViews`, `toFeedPost`.
  `toFeedPost(row, viewerId)` recibe el espectador para poder marcar su propio
  voto de encuesta; sin él (`null`/`undefined`) `myPollVote` es `null`.
- Consultas: `listFeed` (cursor + `take: PAGE_SIZE + 1` + `_count`, sin N+1),
  `getPostForViewer`, `listComments`, `listPostsByAuthor`, `recordPostView`,
  `trackPostView`, `getPostViewStats`.

- **Recientes**: `status = PUBLISHED` ordenado por `createdAt desc, id desc`,
  20 por página, cursor = id del último elemento.
- **Tendencias**: candidatos de los últimos 30 días (máximo 60) puntuados en
  memoria con `likes*3 + comments*2 + views`; una sola página.
- **Siguiendo**: publicaciones de los perfiles seguidos **más las propias**
  (`OR` sobre `authorId`); sin seguir a nadie solo aparecen las tuyas.
- **Anuncios / Vídeos**: filtran por `type`. **Etiqueta**: `tags: { has }`.
- **Búsqueda** (`?q=`): `AND` de un `OR` sobre título, cuerpo y nombre del autor
  con `mode: 'insensitive'`. Se combina con la pestaña y la etiqueta en lugar de
  sustituirlas, y se normaliza (espacios colapsados, 2-60 caracteres) en
  `parseFeedFilters`.
- **Filtros combinables**: `?type=` (tipo de publicación) y `?role=` (rol del
  autor) se validan contra `FEED_TYPE_FILTERS`/`FEED_ROLE_FILTERS` y entran en el
  mismo `where`, así que se pueden combinar con pestaña, etiqueta y búsqueda.
  Viajan también en la paginación (`loadMoreFeedAction` recibe los cinco filtros).
- **Directorio de perfiles** (`?tab=profiles`, también en el público):
  `listProfiles` busca por nombre y filtra por rol, ordena por actividad
  (`_count.posts`) y respeta bloqueos/silencios; marca `isFollowing` con una
  consulta de seguimientos del espectador (sin sesión no consulta nada).
  `ProfileCard` muestra avatar, rol, contadores y botón de seguir.
- **Fijadas**: `listPinnedPosts` las trae aparte (máx. 3, por `pinnedAt desc`) y
  se pasan como `excludeIds` a `listFeed`, así que aparecen destacadas **una sola
  vez** y la paginación por cursor no se rompe.

## Analítica

- **Alcance**: `PostView` guarda un registro por espectador identificable y **uno
  compartido** para las visitas anónimas (`ANON_VIEWER_ID`), que el detalle
  público incrementa con `recordAnonymousView`. `summarizePostViews` separa
  `viewers` (identificables) de `anonymousViews`, así que el alcance ya no ignora
  la web pública sin inventarse identidades.
- **Autor** (`/dashboard/discovery/analytics`, enlazado desde el feed):
  `getAuthorAnalytics` agrega alcance, aperturas anónimas, likes, comentarios,
  engagement, las 5 publicaciones con más interacción, las etiquetas más usadas y
  la **mejor hora** para publicar (hora del servidor, por engagement medio).
- **Feed** (admin): `getFeedHealth` resume publicadas/ocultas, autores activos de
  los últimos 30 días, publicaciones por día de las dos semanas, etiquetas más
  usadas, denuncias por cada 100 publicaciones y **tiempo medio de resolución**
  (calculado con `PostReport.createdAt` → `resolvedAt`).
- Las funciones puras (`summarizeAuthorAnalytics`, `bestPostingHour`, `countTags`,
  `bucketPostsByDay`, `averageResolutionHours`) viven en
  `apps/web/lib/discovery-analytics.ts` y están cubiertas por tests.

## Privacidad y convivencia

`apps/web/lib/discovery-privacy.ts` resuelve **bloquear** y **silenciar**:

- `BLOCK` es **mutuo**: `hiddenAuthorIds` oculta a los bloqueados en los dos
  sentidos (el que bloquea deja de ver y el bloqueado también), y bloquearte corta
  los seguimientos de ambos en `togglePrivacyRule`. Abrir una publicación por
  enlace directo de alguien que te bloqueó devuelve **404** (`getPostForViewer`).
- `MUTE` es **unilateral**: solo dejo de ver su contenido.
- La política de comentarios es del autor (`Post.commentsPolicy`):
  *cualquiera · solo quien me sigue · nadie*, y `canComment` la combina con los
  bloqueos. En el detalle, quien no puede comentar ve el motivo en lugar de la
  caja de comentario (el autor siempre puede comentar en lo suyo).
- El muro (`/dashboard/discovery/u/<id>`) muestra los botones **Seguir**,
  **Silenciar** y **Bloquear** (con confirmación) o, si ya le bloqueaste, el
  aviso y el botón para deshacerlo; si te bloqueó él, el muro responde
  "Este perfil no está disponible".
- **Límite conocido**: en el espejo público no hay espectador identificable, así
  que los bloqueos no filtran ahí.

## Compositor (galería, menciones, borradores, programación y encuestas)

Todo se resuelve en `createPostAction` (`app/actions/discovery.ts`) desde un único
formulario; el compositor (`components/discovery/post-composer.tsx`, cliente) no
duplica reglas, solo recoge datos.

- **Galería + texto alternativo**: el campo `files` (múltiple) sube **hasta cuatro
  imágenes** con el mismo `storeUpload` de siempre (límite y tipos de
  `POST_IMAGE_MIME_EXT`); la primera pasa a ser `mediaUrl`/`mediaKind = 'image'` y
  todas se guardan en `mediaUrls`. `mediaAlt` (máx. 200) acompaña a la galería y
  se usa en el `alt` de cada imagen (`"<alt> (2/4)"` cuando hay varias). El `POST_GALLERY_MAX`
  vive en `discovery-content.ts` para que formulario y acción compartan el tope.
- **Menciones**: `extractMentions` (puro) saca los candidatos del texto —`@` que
  **no** venga pegado a una palabra (así los correos no cuentan), nombre
  empezando en mayúscula y **como máximo dos palabras** (los nombres del
  directorio son `Nombre Apellido`)—, y `resolveMentions` los cruza con `User`
  (`name` exacto, sin distinguir mayúsculas; ignora lo que no exista y nunca se
  menciona al autor). El compositor ofrece los perfiles más activos como chips
  que insertan `@Nombre`, y cada mención resuelta recibe un aviso
  `post_mention` agrupado. Las menciones **no** enlazan dentro del texto: el
  cuerpo se sigue pintando como texto plano (sin HTML), así que no hay inyección.
- **Borradores**: el botón `Guardar borrador` envía `intent=draft` y la
  publicación se crea con `status: DRAFT` (el compositor ya no necesita una
  segunda acción). El autor ve sus borradores en `DraftsCard` —solo él: el feed
  filtra `PUBLISHED`— con "Publicar" (`publishDraftAction`) y "Borrar". Un
  borrador **no avisa a nadie** ni pasa el filtro de lenguaje al guardarse (aún
  no es visible), pero sí al publicarse: `publishDraftAction` revisa
  `containsBannedWord` y lo deja `HIDDEN` con traza si toca. Publicar un borrador
  no cuenta como publicación nueva, así que no aplican ritmo ni duplicados.
- **Programación**: `publishAt` (input `datetime-local`) guarda la publicación
  como `DRAFT` hasta su hora; si la fecha ya pasó, se publica al momento. El
  barrido vive en `lib/discovery-scheduler.ts` (`publishDuePosts`) y se ejecuta a
  mano o por cron:

  ```bash
  pnpm scripts:publish-scheduled   # DRAFT con publishAt <= ahora  →  PUBLISHED
  ```

  Vive aparte de `lib/discovery.ts` a propósito: solo depende de la base de
  datos, así que el script (o un cron de Railway) no arrastra la sesión ni
  NextAuth. Sin Redis ni workers.
- **Encuestas**: el compositor manda cuatro campos `pollOption`; la acción
  descarta vacíos, repite sin duplicados, corta a cuatro y, si quedan **menos de
  dos**, ignora el campo (`pollOptions = []`). `votePollAction` valida que la
  publicación esté publicada, que tenga encuesta y que el índice exista, y luego
  hace `upsert` en `PostPollVote`: **un voto por persona** que se puede cambiar.
  `toFeedPost(row, viewerId)` calcula `pollCounts` (con `countPollVotes`) y
  `myPollVote` a partir de la relación `pollVotes` que incluye `POST_INCLUDE`; la
  barra de cada opción y el ✓ del propio voto se pintan en `post-card`, y en el
  espejo público (`readOnly`) la encuesta sale en solo lectura con los
  porcentajes.

## Módulos y carga incremental

- `apps/web/lib/discovery-content.ts` es **client-safe** (tipos, filtros, ranking,
  formato, `resolveEmbed`, `toFeedPost`): no importa Prisma ni la sesión. Los
  componentes de cliente (`post-card`, `comment-list`, `feed-tabs`, `feed-search`,
  `notifications-bell`, `feed-list`) importan de ahí, y `lib/discovery.ts`
  —que sí consulta— **reexporta** todo para no cambiar ningún import existente.
- `FeedList` (cliente) implementa "Ver más" **sin recargar**: acumula las páginas
  siguientes que devuelve `loadMoreFeedAction`, manteniendo como fuente de verdad
  las publicaciones del servidor (así un refresco de ruta tras un me gusta no
  pierde lo cargado). El espejo público mantiene el enlace con cursor, que
  funciona sin JavaScript.
- `apps/web/lib/discovery-guardrails.ts` (server) aplica los topes anti-abuso de
  `FEED_RATE_LIMITS` (publicaciones y comentarios por hora, enlaces por texto,
  ventana de duplicados) contando en la propia base —sin Redis— y la lista
  `FEED_BANNED_WORDS`. El ritmo, el duplicado y los enlaces **rechazan** con un
  mensaje claro; el lenguaje prohibido **no se pierde**: la publicación se crea
  `HIDDEN`, queda en la traza como automática y el autor ve el aviso de
  "en revisión" en el detalle.

## Avisos y tiempo real percibido

- **Agrupación**: `notifyGrouped` (`lib/notifications/notify.ts`) reutiliza el
  aviso pendiente del mismo `type` + `link` dentro de una ventana de 24 h y sube
  su contador (`Notification.count`) en vez de crear uno por interacción. Si la
  agrupación falla, cae al `notifyUser` simple: nunca se pierde el aviso.
- **A quién avisa**: me gusta y comentarios van al autor de la publicación; una
  **respuesta** (`parentId`) va a quien escribió el comentario —y solo si el padre
  pertenece a la misma publicación—; los seguidores nuevos agrupan en el muro del
  seguido; una **mención** (`@Nombre`, tipo `post_mention`) va a cada perfil
  mencionado en el texto, nunca al autor.
- **Bandeja**: `NotificationsBell` (cliente) vive en el bloque de cuenta del
  sidebar, así que **todos los roles** ven sus avisos (antes el contador solo se
  calculaba para `player`), con contador, agrupación visible `(3)` y "marcar como
  leídos" reutilizando `markNotificationsReadAction`. `listNotifications` y
  `countUnreadNotifications` resuelven la bandeja.
- **Optimista**: el me gusta (`useOptimistic`) y el seguir se pintan al instante y
  se confirman con la respuesta del servidor, con `aria-live` en el contador.
- **Hilos**: los comentarios admiten un nivel de respuestas con UI propia
  ("Responder" por comentario) y **edición** del texto propio
  (`updateCommentAction` + `EditCommentForm`).

## Espejo público

Las páginas de `apps/web/app/(public)/discovery/` (feed, `[postId]`, `u/[userId]`
y `tag/[tag]`) reutilizan los mismos componentes y consultas con **`viewerId`
ausente**:

- `publicFeedFilters` descarta las pestañas que exigen sesión (*Para ti*,
  *Siguiendo*) y deja el resto con sus etiquetas y búsqueda.
- `listFeed`, `listPinnedPosts` y `getPostForViewer` **omiten el `include` de
  `likes`** cuando no hay espectador (`likedByMe` queda en `false`) y el detalle
  público solo alcanza `status: PUBLISHED`.
- `listFeed` con la pestaña *Siguiendo* y sin espectador devuelve una página
  **vacía** en lugar del feed completo.
- `getFollowStats` sin espectador devuelve los contadores con `isFollowing:
  false` y no consulta la relación.
- `PostCard`, `CommentList`, `FeedTabs` y `FeedSearch` aceptan `readOnly` / `base`
  para no pintar acciones y enlazar a las rutas públicas.
- **No se cuentan vistas**: sin sesión no hay espectador identificable, así que el
  alcance sigue midiendo solo visitas atribuibles.

SEO: el grupo `(public)` ya es `force-dynamic` (PGlite no puede prerenderizar),
`generateMetadata` construye título, descripción y `canonical` por publicación y
por perfil, `app/sitemap.ts` incluye `/discovery`, cada publicación publicada y
cada autor con contenido, y `app/robots.ts` bloquea `/dashboard`.

## Moderación

- **Cola**: `listReportedPosts` agrupa las denuncias **pendientes**
  (`resolvedAt: null`) por publicación, las ordena por número de denuncias y
  devuelve el autor, el estado y los motivos con quién los denunció.
- **Acciones** (`apps/web/app/actions/discovery.ts`, todas solo `ADMIN`):
  `moderatePostAction` (ocultar/republicar; al ocultar marca las denuncias como
  atendidas), `pinPostAction` (fija/desfija), `resolveReportsAction` (atiende
  sin tocar la publicación) y `deletePostAction` (que registra la retirada
  cuando el admin borra contenido ajeno).
- **Traza**: `logModeration` escribe en `ModerationLog` y es *best-effort*: si
  falla, la moderación ya aplicada no se deshace. `MODERATION_ACTION_LABELS`
  (`lib/labels.ts`) traduce las acciones en el panel.
- **Panel**: `/dashboard/admin/discovery` (protegido por el prefijo de rol de
  admin) con la cola, los botones de acción y la actividad reciente. Los botones
  son `ActionSubmit` (cliente, `useFormStatus`, confirmación opcional para las
  acciones destructivas).

## Recomendación ("Para ti")

`apps/web/lib/discovery-recommend.ts` reutiliza el motor de `@ifpc/matching`:

- Puro: `relevanceForPlayer` (encaje entre el perfil del espectador y la
  oportunidad que comparte la publicación), `relevanceForOpportunities` (mejor
  encaje del autor jugador con las oportunidades del espectador) y `rankForYou`
  (los que superan el umbral `PLAYER_MATCH_THRESHOLD`, de mayor a menor, y
  después el resto conservando el orden reciente).
- Datos: `listForYouFeed` resuelve el contexto del espectador (`player` si es
  jugador; `recruiter` con sus oportunidades abiertas si es club o universidad;
  `none` en el resto) y una única consulta de candidatos (45 días, máx. 60), más
  una segunda consulta para los perfiles de jugador de los autores cuando hace
  falta. Sin contexto puntuable **no se puntúa nada**: se devuelve el orden
  reciente.

El resultado se muestra con `MatchScoreBadge` (`82% match`) en las publicaciones
que encajan, así que la recomendación es explicable, no una caja negra.

El grafo social y la moderación viven en `apps/web/lib/discovery.ts` (`getFollowStats`,
`listSuggestedProfiles`, `listPinnedPosts`) y `apps/web/lib/discovery-moderation.ts`
(`listReportedPosts`, `listModerationLog`, `logModeration`), con
`toggleFollowAction`, `pinPostAction`, `resolveReportsAction` y
`moderatePostAction` en las acciones.

El estado de los filtros vive en la URL (`?tab=`, `?tag=`, `?cursor=`), así que
son enlaces normales (funcionan sin JS y son compartibles).

## Autorización

- `/dashboard/discovery` es un **área compartida**: `SHARED_DASHBOARD_PREFIXES`
  en `packages/auth/src/permissions.ts` es la única excepción al guard por rol, y
  el middleware usa la misma función (`canAccessDashboard`), con límite de
  segmento (`/dashboard/discovery-x` no es Discovery).
- Las server actions (`apps/web/app/actions/discovery.ts`) nunca confían en el
  formulario: la autoría sale de la sesión y editar/borrar exige ser el autor
  (o `ADMIN`). Borrar un comentario lo permite el autor del comentario, el autor
  de la publicación o un admin.
- Moderación: `moderatePostAction` exige `role === 'ADMIN'`.

## Seguridad

- **Sin HTML**: el texto se renderiza como texto plano (`{post.body}`, con
  `whitespace-pre-wrap`), nunca con `dangerouslySetInnerHTML`.
- **Incrustaciones con lista blanca**: `resolveEmbed` solo acepta YouTube/Vimeo,
  valida el protocolo y normaliza el identificador; cualquier otro origen se
  rechaza antes de guardar, y de nuevo al renderizar.
- **Subidas**: MIME permitidos por lista (JPG/PNG/WebP y MP4/WebM/MOV), tamaño
  máximo (4 MB imagen, 25 MB vídeo) y nombre aleatorio (`crypto.randomUUID()`).
  Los ficheros se guardan en `public/uploads/posts/` (gitignored) y se borran
  del disco al eliminar la publicación.
- **Navegación interna**: el `redirectTo` de borrado pasa por `dashboardPath`
  (`apps/web/lib/safe-redirect.ts`), que descarta protocolos, `//`, `..` y `\`.
- **Métricas**: la vista nunca cuenta al propio autor.

## UI

Componentes en `apps/web/components/discovery/`: `post-composer` (cliente; tipo,
texto, medios sueltos, **galería**, **texto alternativo**, etiquetas, **encuesta**,
privacidad de comentarios, **programación**, chips de **menciones** y botón de
**borrador**), `post-card` (servidor, presentacional; incluye la **galería** y el
bloque de **encuesta** con barras y voto), `post-actions` (cliente),
`drafts-card` (borradores y programadas del autor, con "Publicar"/"Borrar"),
`comment-form` / `comment-list`, `edit-post-form`,
`feed-tabs` (enlaces), `feed-search` (formulario GET, funciona sin JS),
`follow-button` (cliente, con `useFormStatus`), `action-submit` (botón de action
con confirmación opcional) y `suggested-profiles`.

Páginas: `app/dashboard/discovery/page.tsx` (feed),
`[postId]/page.tsx` (detalle, comentarios, alcance y moderación),
`u/[userId]/page.tsx` (muro del autor) y `tag/[tag]/page.tsx` (valida la
etiqueta y redirige al feed filtrado).

Reutiliza el diseño compartido (`PageHeader`, `Card`, `Badge`, `Button`,
`PlayerAvatar`), así que hereda el look Future Baller sin CSS nuevo.

## Datos de demo

`packages/database/prisma/seed.ts` crea siete publicaciones (una por tipo de
perfil), con likes, comentarios, alcance y relaciones de seguimiento, mediante
`upsert` con ids fijos (`seed-post-*`, `seed-comment-*`) o claves compuestas, por
lo que `pnpm db:seed` es idempotente.

## Notas

- Las subidas viven en el sistema de ficheros: en producción (Railway) es
  efímero, así que los vídeos largos se recomiendan por URL externa. El paso a
  S3 con URLs firmadas está descrito en `docs/technical/storage.md`.
- Tras una server action Next revalida la ruta actual, así que la mayoría de las
  acciones no llaman a `revalidatePath`. Las excepciones son las que cambian datos
  que el usuario ve **fuera** de la ruta donde actúa —`createPostAction` al guardar
  un borrador, `votePollAction` (feed + detalle) y `publishDraftAction`—, y todas
  pasan por `lib/revalidate.ts` (`revalidatePaths`): así el import de
  `next/cache` queda aislado en un único módulo que los tests pueden mockear
  (`revalidatePath` solo funciona dentro de una petición real de Next, fuera lanza
  un invariante, y `next` se resuelve desde `apps/web/node_modules`, no desde la
  raíz del repo).
- El limpiador de ficheros huérfanos (`scripts/maintenance/cleanup.ts` y el job
  `cleanup-files` del worker) conoce `Post.mediaUrl` **y** `Post.mediaUrls`, y
  revisa también `uploads/posts/`, para no borrar las imágenes de una **galería**.
- La galería y la encuesta se pintan igual en el dashboard y en el espejo público;
  la única diferencia es que el espejo va en `readOnly` (sin formularios de voto
  ni compositor).
