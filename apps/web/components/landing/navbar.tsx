'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { IconMenu, IconX } from './icons';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/activities', label: 'Activities' },
  { href: '/events', label: 'Events' },
  { href: '/products', label: 'Products' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all sm:px-6 ${
          scrolled
            ? 'mt-3 h-14 rounded-full border border-white/10 bg-[#0a0e0c]/85 backdrop-blur-md'
            : 'h-16 border border-transparent'
        }`}
        style={{ maxWidth: scrolled ? '72rem' : undefined }}
      >
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-5 py-2 text-sm font-bold text-emerald-950 transition-transform hover:scale-[1.03]"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/5 md:hidden"
          aria-label="Menu"
        >
          {open ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="mx-3 mt-2 rounded-2xl border border-white/10 bg-[#0a0e0c]/95 px-4 pb-4 pt-2 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-4 py-2.5 text-center text-sm font-bold text-emerald-950"
              >
                Sign up
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}