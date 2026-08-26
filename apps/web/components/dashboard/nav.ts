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
      label: 'Main',
      items: [
        { href: '/dashboard/player', label: 'Overview', icon: 'home' },
        { href: '/dashboard/player/profile', label: 'My profile', icon: 'user' },
        { href: '/dashboard/player/development', label: 'My development', icon: 'trending' },
      ],
    },
    {
      label: 'My career',
      items: [
        { href: '/dashboard/player/opportunities', label: 'Opportunities', icon: 'target' },
        { href: '/dashboard/player/scouting', label: 'Scouting profile', icon: 'search' },
        { href: '/dashboard/player/membership', label: 'Membership', icon: 'star' },
      ],
    },
    {
      label: 'Content',
      items: [
        { href: '/dashboard/player/training', label: 'Training', icon: 'play' },
        { href: '/dashboard/player/videos', label: 'My videos', icon: 'video' },
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
        { href: '/dashboard/club', label: 'Overview' },
        { href: '/dashboard/club/profile', label: 'Club profile' },
        { href: '/dashboard/club/staff', label: 'Staff' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/club/opportunities', label: 'Opportunities' },
        { href: '/dashboard/club/requirements', label: 'Requirements' },
        { href: '/dashboard/club/applications', label: 'Applications' },
        { href: '/dashboard/club/players', label: 'Players' },
        { href: '/dashboard/club/matching', label: 'Matching' },
        { href: '/dashboard/club/inquiries', label: 'Inquiries' },
      ],
    },
  ],
  agent: [
    {
      label: 'General',
      items: [{ href: '/dashboard/agent', label: 'Overview' }],
    },
    {
      label: 'Players',
      items: [
        { href: '/dashboard/agent/players', label: 'My players' },
        { href: '/dashboard/agent/players/add', label: 'Add player' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/agent/submissions', label: 'Submissions' },
        { href: '/dashboard/agent/trials', label: 'Trials' },
        { href: '/dashboard/agent/negotiations', label: 'Negotiations' },
        { href: '/dashboard/agent/contracts', label: 'Contracts' },
        { href: '/dashboard/agent/opportunities', label: 'Opportunities' },
        { href: '/dashboard/agent/matching', label: 'Matching' },
        { href: '/dashboard/agent/clubs', label: 'Clubs' },
        { href: '/dashboard/agent/documents', label: 'Documents' },
        { href: '/dashboard/agent/communications', label: 'Communications' },
      ],
    },
  ],
  scout: [
    {
      label: 'General',
      items: [{ href: '/dashboard/scout', label: 'Overview' }],
    },
    {
      label: 'Scouting',
      items: [
        { href: '/dashboard/scout/players', label: 'Players' },
        { href: '/dashboard/scout/saved', label: 'Saved' },
        { href: '/dashboard/scout/scouting-reports', label: 'Reports' },
        { href: '/dashboard/scout/opportunities', label: 'Opportunities' },
      ],
    },
  ],
  coach: [
    {
      label: 'General',
      items: [{ href: '/dashboard/coach', label: 'Overview' }],
    },
    {
      label: 'Training',
      items: [
        { href: '/dashboard/coach/players', label: 'My players' },
        { href: '/dashboard/coach/evaluations', label: 'Evaluations' },
        { href: '/dashboard/coach/training', label: 'Training' },
        { href: '/dashboard/coach/live-sessions', label: 'Live sessions' },
      ],
    },
  ],
  parent: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/parent', label: 'Overview' },
        { href: '/dashboard/parent/settings', label: 'Settings' },
      ],
    },
    {
      label: 'Family',
      items: [
        { href: '/dashboard/parent/children', label: 'My children' },
        { href: '/dashboard/parent/pathways', label: 'Pathways' },
        { href: '/dashboard/parent/opportunities', label: 'Opportunities' },
        { href: '/dashboard/parent/education', label: 'Education' },
        { href: '/dashboard/parent/payments', label: 'Payments' },
      ],
    },
  ],
  university: [
    {
      label: 'General',
      items: [
        { href: '/dashboard/university', label: 'Overview' },
        { href: '/dashboard/university/profile', label: 'Profile' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { href: '/dashboard/university/opportunities', label: 'Opportunities' },
        { href: '/dashboard/university/players', label: 'Players' },
      ],
    },
  ],
  admin: [
    {
      label: 'General',
      items: [{ href: '/dashboard/admin', label: 'Overview' }],
    },
    {
      label: 'Management',
      items: [
        { href: '/dashboard/admin/players', label: 'Players' },
        { href: '/dashboard/admin/clubs', label: 'Clubs' },
        { href: '/dashboard/admin/users', label: 'Users' },
        { href: '/dashboard/admin/opportunities', label: 'Opportunities' },
        { href: '/dashboard/admin/memberships', label: 'Memberships' },
        { href: '/dashboard/admin/recruitment', label: 'Recruitment' },
        { href: '/dashboard/admin/camps', label: 'Camps', icon: 'trophy' },
        { href: '/dashboard/admin/live-sessions', label: 'Live sessions', icon: 'live' },
        { href: '/dashboard/admin/matching', label: 'Matching', icon: 'target' },
        { href: '/dashboard/admin/communications', label: 'Communications', icon: 'mail' },
        { href: '/dashboard/admin/documents', label: 'Documents', icon: 'file' },
        { href: '/dashboard/admin/analytics', label: 'Analytics' },
        { href: '/dashboard/admin/content', label: 'Content' },
        { href: '/dashboard/admin/notifications', label: 'Notifications' },
        { href: '/dashboard/admin/settings', label: 'Settings' },
      ],
    },
  ],
};

export const FALLBACK_NAV: NavSection[] = [
  {
    label: 'General',
    items: [{ href: '/dashboard', label: 'Overview' }],
  },
];

