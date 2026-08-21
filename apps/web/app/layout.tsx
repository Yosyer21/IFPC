import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Future Buller',
    template: '%s | Future Buller',
  },
  description:
    'Plataforma global de fútbol: desarrollo de jugadores, scouting y reclutamiento profesional. Perfiles, pruebas, becas y contratos.',
  applicationName: 'Future Buller',
  keywords: ['fútbol', 'scouting', 'reclutamiento', 'becas', 'jugadores', 'trials'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Future Buller',
    title: 'Future Buller',
    description:
      'Plataforma global de fútbol: desarrollo de jugadores, scouting y reclutamiento profesional.',
    url: APP_URL,
  },
  twitter: {
    card: 'summary',
    title: 'Future Buller',
    description:
      'Plataforma global de fútbol: desarrollo de jugadores, scouting y reclutamiento profesional.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
