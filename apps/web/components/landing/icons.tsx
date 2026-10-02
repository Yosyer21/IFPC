import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </Base>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

export function IconWhistle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 19a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-6H4v6Z" />
      <path d="M13 8h3l4 2v3a3 3 0 0 1-3 3h-1" />
      <circle cx="7" cy="8" r="3" />
    </Base>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Base>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  );
}

export function IconVideo(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="6" width="13" height="12" rx="2" />
      <path d="m15 10 7-3v10l-7-3" />
    </Base>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Base>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <path d="M5 16.5V13a4 4 0 0 1 4-4h6a4 4 0 0 0 4-4V7.5" />
    </Base>
  );
}

export function IconStar(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m12 2 3 6.5 7 .8-5.2 4.7 1.4 7L12 17.8 5.8 21l1.4-7L2 9.3l7-.8L12 2Z" />
    </Base>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m4 12 5 5L20 6" />
    </Base>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Base>
  );
}

export function IconX(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Base>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
    </Base>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </Base>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Base>
  );
}

export function IconTicket(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a3 3 0 0 0 0 6v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a3 3 0 0 0 0-6V8Z" />
      <path d="M13 6v12" />
    </Base>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 19a2 2 0 0 0 2 2h13" />
    </Base>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.5 12 20 12 20Z" />
    </Base>
  );
}

export function IconBall(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 6.5 3.6 2.6-1.4 4.3H9.8L8.4 9.1 12 6.5Z" />
      <path d="M12 3v3.5M4.7 8.7 8.4 9.1M19.3 8.7l-3.7.4M6.7 18.5l3.1-3.5M17.3 18.5l-3.1-3.5M12 21v-4.4" />
    </Base>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 21h6M12 14v7" />
    </Base>
  );
}
