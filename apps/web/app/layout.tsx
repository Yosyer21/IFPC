import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Anton, Inter } from 'next/font/google';
import './globals.css';

// Tipografía del sistema: Anton (titulares deportivos, condensada y gruesa) e
// Inter (texto y UI). Se exponen como variables CSS y Tailwind las usa en
// `font-display` / `font-sans`.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Viewport móvil: `viewport-fit=cover` deja que la web use toda la pantalla y
 * las utilidades `*-safe` de globals.css compensan el notch. El zoom se permite
 * (accesibilidad) pero el layout ya está pensado para no necesitarlo.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F4F1' },
    { media: '(prefers-color-scheme: dark)', color: '#11151B' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Future Baller',
    template: '%s | Future Baller',
  },
  description:
    'Future Baller — holistic football development for girls aged 10–18, led by Matildas Chloe Logarzo and Emily Gielnik. Clinics, squad super sessions and mindset tools.',
  applicationName: 'Future Baller',
  keywords: [
    'Future Baller',
    'girls football',
    'football clinics',
    'soccer',
    'development',
    'Matildas',
    'Chloe Logarzo',
    'Emily Gielnik',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'Future Baller',
    title: 'Future Baller',
    description:
      'Holistic football development for girls aged 10–18, led by Matildas Chloe Logarzo and Emily Gielnik.',
    url: APP_URL,
  },
  twitter: {
    card: 'summary',
    title: 'Future Baller',
    description:
      'Holistic football development for girls aged 10–18, led by Matildas Chloe Logarzo and Emily Gielnik.',
  },
  robots: { index: true, follow: true },
  // PWA: instalable en la pantalla de inicio (iconos + manifest).
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/icons/icon-192.png'],
  },
  // Instalación como app (iOS) y sin detección automática de teléfonos.
  appleWebApp: {
    capable: true,
    title: 'Future Baller',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
