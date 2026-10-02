import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Mission } from '@/components/landing/mission';
import { Offerings } from '@/components/landing/offerings';
import { Gallery } from '@/components/landing/gallery';
import { Positioning } from '@/components/landing/positioning';
import { Founders } from '@/components/landing/founders';
import { FeaturedEvent } from '@/components/landing/featured-event';
import { FeaturedProduct } from '@/components/landing/featured-product';
import { Newsletter } from '@/components/landing/newsletter';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Future Buller — The World of Future Buller',
  description:
    'Holistic football development for girls aged 10–18, led by Matildas Chloe Logarzo and Emily Gielnik. Clinics, squad super sessions and mindset tools.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white selection:bg-emerald-500/30">
      <Navbar />
      <main>
        <Hero />
        <Mission />
        <Offerings />
        <Gallery />
        <Positioning />
        <Founders />
        <FeaturedEvent />
        <FeaturedProduct />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

