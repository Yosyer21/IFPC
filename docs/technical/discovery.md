# Discovery (técnico)

## Modelo de datos

Cuelga de `User` (no de `Player`) para que **cualquier rol** pueda publicar.

| Modelo        | Uso                                                                        |
| ------------- | -------------------------------------------------------------------------- |
| `Post`        | Publicación: `authorId`, `type`, `status`, texto, medio y etiquetas.        |
| `PostLike`    | Un "me gusta" por persona y publicación (`@@unique([postId, userId])`).     |
| `PostComment` | Comentario; `parentId` da un nivel de respuestas (auto-relación).           |
| `PostView`    | Alcance: un registro por publicación + espectador, con contador y fechas.   |
| `PostReport`  | Denuncia (una por persona y publicación).                                   |
| `Follow`      | Relación social: `followerId` → `followingId` (cualquier rol sigue a cualquiera). |

Enums: `PostType` (`ANNOUNCEMENT · VIDEO · PHOTO · ACHIEVEMENT`) y `PostStatus`
(`DRAFT · PUBLISHED · HIDDEN`; `HIDDEN` solo lo aplica un admin).

Campos relevantes de `Post`:

- `mediaUrl` + `mediaKind` (`image` | `video` | `embed`). Para los medios
  subidos la URL es `/uploads/posts/<uuid>.<ext>`; para YouTube/Vimeo se guarda
  ya la **URL canónica de incrustación**.
- `linkUrl` (enlace libre) y `opportunityId` (oportunidad compartida).
- `tags String[]` (Postgres `TEXT[]`; se consultan con `tags: { has: tag }`).
- `pinnedAt` reservado para destacar publicaciones (F3; hoy no ordena el feed).

`PostView` sigue el patrón de `ProfileView`: el espectador es un `String`, no una
relación, para que borrar un usuario no arrastre métricas.

## Ranking y paginación

`apps/web/lib/discovery.ts` separa lo puro de lo que consulta la base:

- Puro (testeado en `tests/unit/discovery/feed.test.ts`): `parseFeedFilters`,
  `extractTags`, `resolveEmbed`, `engagementScore`, `rankTrendingPosts`,
  `formatRelativeTime`, `summarizePostViews`.
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

El grafo social vive en `apps/web/lib/discovery.ts`: `getFollowStats`
(seguidores, siguiendo y si el espectador sigue) y `listSuggestedProfiles`
(los más seguidos que aún no sigues, excluyéndote a ti y a los ya seguidos),
con `toggleFollowAction` en las acciones.

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

Componentes en `apps/web/components/discovery/`: `post-composer` (cliente),
`post-card` (servidor, presentacional), `post-actions` (cliente),
`comment-form` / `comment-list`, `edit-post-form`, `feed-tabs` (enlaces),
`follow-button` (cliente, con `useFormStatus`) y `suggested-profiles`.

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
- Tras una server action Next revalida la ruta actual, así que las acciones no
  llaman a `revalidatePath` (evita depender del store de generación y hace los
  tests unitarios triviales).
