interface NavItem {
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
      label: 'Main',
      items: [
        { href: '/dashboard/player', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
        { href: '/dashboard/player/profile', label: 'My profile', icon: 'user' },
        { href: '/dashboard/player/development', label: 'My development', icon: 'trending' },
      ],
    },
    {
      label: 'My career',
      items: [
        { href: '/dashboard/player/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/player/career', label: 'Career history', icon: 'trophy' },
        { href: '/dashboard/player/membership', label: 'Membership', icon: 'star' },
      ],
    },
    {
      label: 'Content',
      items: [
        { href: '/dashboard/player/training', label: 'Training', icon: 'play' },
        { href: '/dashboard/player/documents', label: 'My documents', icon: 'file' },
        { href: '/dashboard/player/live-sessions', label: 'Live sessions', icon: 'live' },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/dashboard/player/notifications', label: 'Notifications', icon: 'bell' },
        { href: '/dashboard/player/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  club: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/club', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
        { href: '/dashboard/club/profile', label: 'Club profile', icon: 'briefcase' },
        { href: '/dashboard/club/staff', label: 'Staff', icon: 'users' },
        { href: '/dashboard/club/live-sessions', label: 'Live sessions', icon: 'live' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/club/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/club/requirements', label: 'Requirements', icon: 'check' },
        { href: '/dashboard/club/applications', label: 'Applications', icon: 'inbox' },
        { href: '/dashboard/club/players', label: 'Players', icon: 'search' },
        { href: '/dashboard/club/matching', label: 'Matching', icon: 'sparkles' },
        { href: '/dashboard/club/inquiries', label: 'Inquiries', icon: 'mail' },
      ],
    },
  ],
  agent: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/agent', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
      ],
    },
    {
      label: 'Players',
      items: [
        { href: '/dashboard/agent/players', label: 'My players', icon: 'users' },
        { href: '/dashboard/agent/players/add', label: 'Add player', icon: 'user' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/agent/submissions', label: 'Submissions', icon: 'mail' },
        { href: '/dashboard/agent/trials', label: 'Trials', icon: 'whistle' },
        { href: '/dashboard/agent/negotiations', label: 'Negotiations', icon: 'briefcase' },
        { href: '/dashboard/agent/contracts', label: 'Contracts', icon: 'file' },
        { href: '/dashboard/agent/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/agent/matching', label: 'Matching', icon: 'sparkles' },
        { href: '/dashboard/agent/clubs', label: 'Clubs', icon: 'shield' },
        { href: '/dashboard/agent/documents', label: 'Documents', icon: 'file' },
        { href: '/dashboard/agent/communications', label: 'Communications', icon: 'bell' },
      ],
    },
  ],
  scout: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/scout', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
      ],
    },
    {
      label: 'Scouting',
      items: [
        { href: '/dashboard/scout/players', label: 'Players', icon: 'search' },
        { href: '/dashboard/scout/saved', label: 'Saved', icon: 'star' },
        { href: '/dashboard/scout/scouting-reports', label: 'Reports', icon: 'file' },
        { href: '/dashboard/scout/opportunities', label: 'Opportunities', icon: 'target' },
      ],
    },
  ],
  coach: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/coach', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
      ],
    },
    {
      label: 'Training',
      items: [
        { href: '/dashboard/coach/players', label: 'My players', icon: 'users' },
        { href: '/dashboard/coach/evaluations', label: 'Evaluations', icon: 'check' },
        { href: '/dashboard/coach/training', label: 'Training', icon: 'play' },
        { href: '/dashboard/coach/live-sessions', label: 'Live sessions', icon: 'live' },
      ],
    },
  ],
  parent: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/parent', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'settings' },
      ],
    },
    {
      label: 'Family',
      items: [
        { href: '/dashboard/parent/children', label: 'My children', icon: 'users' },
        { href: '/dashboard/parent/pathways', label: 'Pathways', icon: 'route' },
        { href: '/dashboard/parent/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/parent/education', label: 'Education', icon: 'book' },
        { href: '/dashboard/parent/payments', label: 'Payments', icon: 'star' },
      ],
    },
  ],
  university: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/university', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
        { href: '/dashboard/university/profile', label: 'Profile', icon: 'briefcase' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/university/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/university/players', label: 'Players', icon: 'users' },
      ],
    },
  ],
  school: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/school', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
        { href: '/dashboard/school/profile', label: 'Organization profile', icon: 'briefcase' },
      ],
    },
    {
      label: 'Programme',
      items: [
        { href: '/dashboard/school/participants', label: 'Participants', icon: 'users' },
        { href: '/dashboard/school/opportunities', label: 'Opportunities', icon: 'target' },
      ],
    },
  ],
  admin: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/admin', label: 'Overview', icon: 'home' },
        { href: '/dashboard/discovery', label: 'Discovery', icon: 'compass' },
      ],
    },
    {
      label: 'Management',
      items: [
        { href: '/dashboard/admin/players', label: 'Players', icon: 'users' },
        { href: '/dashboard/admin/clubs', label: 'Clubs', icon: 'briefcase' },
        { href: '/dashboard/admin/users', label: 'Users', icon: 'user' },
        { href: '/dashboard/admin/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/admin/memberships', label: 'Memberships', icon: 'star' },
        { href: '/dashboard/admin/recruitment', label: 'Recruitment', icon: 'whistle' },
        { href: '/dashboard/admin/camps', label: 'Camps', icon: 'trophy' },
        { href: '/dashboard/admin/live-sessions', label: 'Live sessions', icon: 'live' },
        { href: '/dashboard/admin/matching', label: 'Matching', icon: 'sparkles' },
        { href: '/dashboard/admin/communications', label: 'Communications', icon: 'mail' },
        { href: '/dashboard/admin/documents', label: 'Documents', icon: 'file' },
        { href: '/dashboard/admin/analytics', label: 'Analytics', icon: 'chart' },
        { href: '/dashboard/admin/content', label: 'Content', icon: 'layers' },
        { href: '/dashboard/admin/discovery', label: 'Discovery moderation', icon: 'shield' },
        { href: '/dashboard/admin/notifications', label: 'Notifications', icon: 'bell' },
        { href: '/dashboard/admin/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
};

export const FALLBACK_NAV: NavSection[] = [
  {
    label: 'General',
    items: [{ href: '/dashboard', label: 'Overview', icon: 'home' }],
  },
];

