import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'IFPC',
    template: '%s | IFPC',
  },
  description:
    'IFPC — International Football Players & Clubs. Global football platform: player development, scouting and professional recruitment. Profiles, trials, scholarships and contracts.',
  applicationName: 'IFPC',
  keywords: ['football', 'scouting', 'recruitment', 'scholarships', 'players', 'trials', 'IFPC'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'IFPC',
    title: 'IFPC',
    description:
      'IFPC — International Football Players & Clubs. Global football platform: player development, scouting and professional recruitment.',
    url: APP_URL,
  },
  twitter: {
    card: 'summary',
    title: 'IFPC',
    description:
      'IFPC — International Football Players & Clubs. Player development, scouting and professional recruitment.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
