import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
