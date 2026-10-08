# Design system (Future Baller)

Una sola identidad visual para la web pública **y todas las áreas privadas**
(dashboards de cada perfil, auth y admin). El look — negro verdoso, acentos
emerald/cyan/lime, superficies "glass", glow y animaciones suaves — nace en el
landing y se propaga mediante **componentes compartidos**, no página a página.

## Tokens (CSS variables)

Definidos en `apps/web/app/globals.css` (`:root` claro / `.dark` oscuro). La app
usa `dark` de forma permanente (`apps/web/app/layout.tsx` → `<html className="dark">`).

## Utilidades globales (`globals.css`)

| Utilidad            | Uso                                                    |
| ------------------- | ------------------------------------------------------ |
| `.glass-card`       | Panel translúcido + blur + borde. Usado por `Card`.    |
| `.app-ambient`      | Fondo con degradados radiales emerald/cyan/lime.       |
| `.bg-grid-faint`    | Rejilla sutil de fondo.                                |
| `.chip-gradient`    | Chip de icono / item activo del sidebar.               |
| `.text-gradient-brand` | Wordmark y títulos con degradado de marca.          |
| `.card-hover`       | Elevación y borde en hover para tarjetas enlazadas.    |
| `.glow`             | Halo emerald para CTAs.                                |
| `.reveal` / `.animate-*` | Animaciones de entrada (fade-up, drift, marquee…). |

## Componentes compartidos (el punto de propagación)

Cambiar estos archivos reestiliza **toda** la app:

- `packages/ui/src/*` — `Card`, `Button`, `Badge`, `Input`, `Select`, `Table`,
  `Modal`, `Dropdown`, `Progress`, `Avatar`, `Tabs`.
- `apps/web/components/player/page-header.tsx` — `PageHeader` (todas las páginas).
- `apps/web/components/player/stat-card.tsx` — KPIs.
- `apps/web/components/dashboard/sidebar.tsx` + `nav.ts` — navegación lateral.
- `apps/web/components/discovery/*` — composer, tarjeta de publicación, comentarios y pestañas del feed.
- `apps/web/app/dashboard/layout.tsx` — fondo ambiental del área privada.
- `apps/web/app/(auth)/layout.tsx` — tarjeta glass de login/registro/onboarding.

## Cómo añadir un área nueva

1. Añade la sección de navegación en `components/dashboard/nav.ts` (clave = rol en minúsculas).
2. Usa `PageHeader`, `Card`/`CardContent`, `Badge` y `StatCard`: heredan el diseño automáticamente.
3. No hace falta CSS nuevo ni estilos por página.
