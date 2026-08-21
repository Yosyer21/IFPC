export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV: Record<string, NavSection[]> = {
  player: [
    {
      label: 'Principal',
      items: [
        { href: '/dashboard/player', label: 'Resumen', icon: 'home' },
        { href: '/dashboard/player/profile', label: 'Mi perfil', icon: 'user' },
        { href: '/dashboard/player/development', label: 'Mi desarrollo', icon: 'trending' },
      ],
    },
    {
      label: 'Mi carrera',
      items: [
        { href: '/dashboard/player/opportunities', label: 'Oportunidades', icon: 'target' },
        { href: '/dashboard/player/scouting', label: 'Perfil de scouting', icon: 'search' },
        { href: '/dashboard/player/membership', label: 'Membresía', icon: 'star' },
      ],
    },
    {
      label: 'Contenido',
      items: [
        { href: '/dashboard/player/training', label: 'Entrenamiento', icon: 'play' },
        { href: '/dashboard/player/videos', label: 'Mis vídeos', icon: 'video' },
        { href: '/dashboard/player/documents', label: 'Mis documentos', icon: 'file' },
        { href: '/dashboard/player/live-sessions', label: 'Sesiones en vivo', icon: 'live' },
      ],
    },
    {
      label: 'Cuenta',
      items: [
        { href: '/dashboard/player/notifications', label: 'Notificaciones', icon: 'bell' },
        { href: '/dashboard/player/settings', label: 'Ajustes', icon: 'settings' },
      ],
    },
  ],
  club: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/club', label: 'Resumen' },
        { href: '/dashboard/club/profile', label: 'Perfil del club' },
        { href: '/dashboard/club/staff', label: 'Staff' },
      ],
    },
    {
      label: 'Reclutamiento',
      items: [
        { href: '/dashboard/club/opportunities', label: 'Oportunidades' },
        { href: '/dashboard/club/requirements', label: 'Requisitos' },
        { href: '/dashboard/club/applications', label: 'Solicitudes' },
        { href: '/dashboard/club/players', label: 'Jugadores' },
        { href: '/dashboard/club/matching', label: 'Matching' },
        { href: '/dashboard/club/inquiries', label: 'Consultas' },
      ],
    },
  ],
  agent: [
    {
      label: 'General',
      items: [{ href: '/dashboard/agent', label: 'Resumen' }],
    },
    {
      label: 'Jugadores',
      items: [
        { href: '/dashboard/agent/players', label: 'Mis jugadores' },
        { href: '/dashboard/agent/players/add', label: 'Añadir jugador' },
      ],
    },
    {
      label: 'Reclutamiento',
      items: [
        { href: '/dashboard/agent/submissions', label: 'Envíos' },
        { href: '/dashboard/agent/trials', label: 'Pruebas' },
        { href: '/dashboard/agent/negotiations', label: 'Negociaciones' },
        { href: '/dashboard/agent/contracts', label: 'Contratos' },
        { href: '/dashboard/agent/opportunities', label: 'Oportunidades' },
        { href: '/dashboard/agent/matching', label: 'Matching' },
        { href: '/dashboard/agent/clubs', label: 'Clubes' },
        { href: '/dashboard/agent/documents', label: 'Documentos' },
        { href: '/dashboard/agent/communications', label: 'Comunicaciones' },
      ],
    },
  ],
  scout: [
    {
      label: 'General',
      items: [{ href: '/dashboard/scout', label: 'Resumen' }],
    },
    {
      label: 'Scouting',
      items: [
        { href: '/dashboard/scout/players', label: 'Jugadores' },
        { href: '/dashboard/scout/saved', label: 'Guardados' },
        { href: '/dashboard/scout/scouting-reports', label: 'Informes' },
        { href: '/dashboard/scout/opportunities', label: 'Oportunidades' },
      ],
    },
  ],
  coach: [
    {
      label: 'General',
      items: [{ href: '/dashboard/coach', label: 'Resumen' }],
    },
    {
      label: 'Entrenamiento',
      items: [
        { href: '/dashboard/coach/players', label: 'Mis jugadores' },
        { href: '/dashboard/coach/evaluations', label: 'Evaluaciones' },
        { href: '/dashboard/coach/training', label: 'Entrenamiento' },
        { href: '/dashboard/coach/live-sessions', label: 'Sesiones en vivo' },
      ],
    },
  ],
  parent: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/parent', label: 'Resumen' },
        { href: '/dashboard/parent/settings', label: 'Ajustes' },
      ],
    },
    {
      label: 'Familia',
      items: [
        { href: '/dashboard/parent/children', label: 'Mis hijos' },
        { href: '/dashboard/parent/pathways', label: 'Rutas' },
        { href: '/dashboard/parent/opportunities', label: 'Oportunidades' },
        { href: '/dashboard/parent/education', label: 'Educación' },
        { href: '/dashboard/parent/payments', label: 'Pagos' },
      ],
    },
  ],
  university: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/university', label: 'Resumen' },
        { href: '/dashboard/university/profile', label: 'Perfil' },
      ],
    },
    {
      label: 'Reclutamiento',
      items: [
        { href: '/dashboard/university/opportunities', label: 'Oportunidades' },
        { href: '/dashboard/university/players', label: 'Jugadores' },
      ],
    },
  ],
  admin: [
    {
      label: 'General',
      items: [{ href: '/dashboard/admin', label: 'Resumen' }],
    },
    {
      label: 'Gestión',
      items: [
        { href: '/dashboard/admin/players', label: 'Jugadores' },
        { href: '/dashboard/admin/clubs', label: 'Clubes' },
        { href: '/dashboard/admin/users', label: 'Usuarios' },
        { href: '/dashboard/admin/opportunities', label: 'Oportunidades' },
        { href: '/dashboard/admin/memberships', label: 'Membresías' },
        { href: '/dashboard/admin/recruitment', label: 'Reclutamiento' },
        { href: '/dashboard/admin/camps', label: 'Camps', icon: 'trophy' },
        { href: '/dashboard/admin/live-sessions', label: 'Sesiones en vivo', icon: 'live' },
        { href: '/dashboard/admin/matching', label: 'Matching', icon: 'target' },
        { href: '/dashboard/admin/communications', label: 'Comunicaciones', icon: 'mail' },
        { href: '/dashboard/admin/documents', label: 'Documentos', icon: 'file' },
        { href: '/dashboard/admin/analytics', label: 'Analíticas' },
        { href: '/dashboard/admin/content', label: 'Contenido' },
        { href: '/dashboard/admin/notifications', label: 'Notificaciones' },
        { href: '/dashboard/admin/settings', label: 'Ajustes' },
      ],
    },
  ],
};

export const FALLBACK_NAV: NavSection[] = [
  {
    label: 'General',
    items: [{ href: '/dashboard', label: 'Resumen' }],
  },
];

