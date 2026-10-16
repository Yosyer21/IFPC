# Design system (Future Baller)

Una sola identidad visual para la web pública **y todas las áreas privadas**
(dashboards de cada perfil, auth y admin). El look — negro azulado/carbón para la
navegación y los paneles oscuros, superficies claras, acento **verde lima**, glow
y animaciones suaves — nace en el landing y se propaga mediante **componentes
compartidos**, no página a página.

## Paleta

| Token      | Hex       | Uso                                                      |
| ---------- | --------- | -------------------------------------------------------- |
| `--brand`  | `#C4F747` | Verde lima: CTAs, estados activos, acentos, indicadores. |
| `--ink`    | `#11151A` | Negro azulado: barras laterales y navegación oscura.     |
| `--panel`  | `#12161B` | Negro carbón: paneles oscuros (hero, promo, overlays).   |
| `--mist`   | `#F4F5F2` | Gris muy claro: fondos generales.                        |
| `--card`   | `#FFFFFF` | Blanco: trazos finos y algún destello puntual.           |
| `--subtle` | `#68717E` | Gris azulado: textos secundarios.                        |

Se usan desde Tailwind como `bg-brand`, `text-ink`, `bg-panel`, `bg-mist`,
`text-subtle`, `border-ink/10`, … El color de texto sobre lima es siempre el
negro azulado (`text-ink`): el lima no es legible como texto sobre fondos claros.

## Tokens (CSS variables)

Definidos en `apps/web/app/globals.css` (`:root` claro / `.dark` oscuro). La app
usa `dark` de forma permanente (`apps/web/app/layout.tsx` → `<html className="dark">`).
Los tokens semánticos (`background`, `card`, `primary`, `border`, `muted`,
`destructive`, `ring`) se derivan de la paleta, así que cambiar el tema se hace
solo ahí.

## Fondo del área privada (`.app-ambient`)

Lo usan el shell del dashboard y el layout de auth. Es una composición de **barras
rectangulares anguladas a 115°**: ni cuadrícula ni círculos, solo degradados
lineales, con el **lima** como protagonista y **líneas blancas finas** como acento.

| Capa             | Color                   | Detalle                                                                  |
| ---------------- | ----------------------- | ------------------------------------------------------------------------ |
| Tinta base       | `--app-backdrop`        | `#0C0F13`: un punto más oscuro que `--ink` para no competir con el texto |
| Marco            | negro al 40-60 %        | losa superior e inferior + columnas laterales (profundidad)              |
| Barra de luz     | lima al 5,5 %           | canto superior                                                           |
| Barras anguladas | lima 3-13 % + panel     | 4 barras anchas/estrechas a 115° que se deslizan en 60 s                 |
| Líneas blancas   | blanco 7-10 %           | 3 líneas finas (≈2 px) que cruzan toda la composición, a 115°            |
| Brillo           | lima 4,5 % + blanco 2 % | recorre la composición en diagonal cada 28 s                             |

Todo se mueve solo con `transform`/`opacity` (barato) y el contenedor lleva
`overflow: hidden`. Los valores (opacidades, grosores y duraciones) están todos en
`globals.css`, dentro de `.app-ambient`, sus `::before`/`::after` y las animaciones
`fb-ambient-slide` / `fb-ambient-sheen`.

## Utilidades globales (`globals.css`)

| Utilidad                          | Uso                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.glass-card`                     | Panel translúcido + blur + borde. Usado por `Card`.                                                                                                            |
| `.surface`                        | Panel sólido para overlays (modales, dropdowns).                                                                                                               |
| `.app-ambient`                    | Fondo del área privada: barras rectangulares anguladas a 115° con marco y brillo.                                                                              |
| `.bg-bars-faint`                  | Franjas anguladas tenues sobre fondos claros.                                                                                                                  |
| `.bg-bars-faint-invert`           | Las mismas franjas sobre superficies oscuras.                                                                                                                  |
| `.chip-gradient`                  | Chip de icono / item activo del sidebar (lima).                                                                                                                |
| `.text-gradient-brand`            | Wordmark y títulos con degradado lima de marca.                                                                                                                |
| `.text-gradient`                  | Degradado lima para titulares sobre superficies oscuras.                                                                                                       |
| `.card-hover`                     | Elevación y borde en hover para tarjetas enlazadas.                                                                                                            |
| `.glow`                           | Halo lima para CTAs.                                                                                                                                           |
| `.reveal` / `.animate-*`          | Animaciones de entrada (fade-up, drift, marquee…).                                                                                                             |
| `.role-card` / `.role-figure`     | Elección de perfil (`/welcome` y registro): tres figuras animadas —balón, pizarra y escudo— que arrancan al pasar el ratón por la tarjeta o al quedar elegida. |
| `.wizard-track` / `.wizard-slide` | Alta en diapositivas (`/welcome`): el paso activo llega deslizándose y su contenido entra con un fade-up al activarse.                                         |

Todas las animaciones respetan `prefers-reduced-motion`: las de entrada aparecen ya en su estado
final y las figuras se quedan quietas.

## Componentes compartidos (el punto de propagación)

Cambiar estos archivos reestiliza **toda** la app:

- `packages/ui/src/*` — `Card`, `Button`, `Badge`, `Input`, `Select`, `Table`,
  `Modal`, `Dropdown`, `Progress`, `Avatar`, `Tabs`.
- `apps/web/components/player/page-header.tsx` — `PageHeader` (todas las páginas).
- `apps/web/components/player/stat-card.tsx` — KPIs.
- `apps/web/components/dashboard/sidebar.tsx` + `nav.ts` — navegación lateral.
- `apps/web/components/discovery/*` — composer, tarjeta de publicación, comentarios y pestañas del feed.
- `apps/web/components/player/profile-header.tsx` + `profile-checklist-card.tsx` — cabecera
  personalizable del perfil (portada, acento, titular y chips) y checklist de fuerza.
- `apps/web/components/player/profile-stats.tsx` — panel de estadísticas del jugador.
- `apps/web/components/player/cover-photo-editor.tsx` + `profile-photo-editor.tsx` — chips
  para cambiar portada y foto desde la propia cabecera.
- `apps/web/app/dashboard/layout.tsx` — fondo ambiental del área privada.
- `apps/web/app/(auth)/layout.tsx` — tarjeta glass de login/registro/onboarding.

## Cómo añadir un área nueva

1. Añade la sección de navegación en `components/dashboard/nav.ts` (clave = rol en minúsculas).
2. Usa `PageHeader`, `Card`/`CardContent`, `Badge` y `StatCard`: heredan el diseño automáticamente.
3. No hace falta CSS nuevo ni estilos por página.
