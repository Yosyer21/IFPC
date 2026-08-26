import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
          <defs>
            <linearGradient id="ifpc-grad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#a3e635" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" fill="url(#ifpc-grad)" />
          <circle cx="16" cy="16" r="14" fill="none" stroke="#0b120f" strokeWidth="1" opacity="0.3" />
          <path
            d="M16 2.5v10.5M16 19v10.5M2.5 16H13M19 16h10.5M6.8 6.8l6.6 6.6M18.6 18.6l6.6 6.6M25.2 6.8l-6.6 6.6M13.4 18.6l-6.6 6.6"
            stroke="#0b120f"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-white">
        IF<span className="text-emerald-400">PC</span>
      </span>
    </Link>
  );
}
