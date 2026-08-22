import Link from 'next/link';
import { Logo } from './logo';
import { IconGlobe, IconMail } from './icons';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/clubs', label: 'Clubs' },
      { href: '/training', label: 'Training' },
      { href: '/register', label: 'Sign up' },
    ],
  },
  {
    title: 'Information',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/parent-hub', label: 'Parent hub' },
      { href: '/pathways', label: 'Development pathways' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Terms of service' },
      { href: '#', label: 'Privacy policy' },
      { href: '#', label: 'Cookies' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#080b0a]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/45">
              The global platform where young talent connects with clubs, scouts and agents.
            </p>
            <div className="mt-6 flex items-center gap-3 text-white/40">
              <a
                href="mailto:hello@ifpc.com"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
                aria-label="Email"
              >
                <IconMail className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
                aria-label="Website"
              >
                <IconGlobe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/45 transition-colors hover:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row">
          <p className="text-sm text-white/35">
            © {new Date().getFullYear()} IFPC. All rights reserved.
          </p>
          <p className="text-sm text-white/35">Built for football</p>
        </div>
      </div>
    </footer>
  );
}
