import Link from 'next/link';
import { Logo } from './logo';
import { IconGlobe, IconMail } from './icons';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/activities', label: 'Activities' },
      { href: '/events', label: 'Events' },
      { href: '/products', label: 'Products' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact us' },
      { href: '/register', label: 'Sign up' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/info/disclaimer', label: 'Disclaimer' },
      { href: '/info/copyright', label: 'Copyright' },
      { href: '/info/privacy', label: 'Privacy' },
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
              Holistic football development for girls aged 10–18, led by Matildas Chloe Logarzo and
              Emily Gielnik.
            </p>
            <div className="mt-6 flex items-center gap-3 text-white/40">
              <a
                href="mailto:hello@futureballer.com"
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
            © {new Date().getFullYear()} Future Baller. All rights reserved.
          </p>
          <p className="text-xs text-white/25">
            Photography: Wikimedia Commons contributors (CC BY-SA)
          </p>
        </div>
      </div>
    </footer>
  );
}