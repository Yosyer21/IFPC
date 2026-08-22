import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { TrustedBy } from '@/components/landing/trusted-by';
import { Roles } from '@/components/landing/roles';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Stats } from '@/components/landing/stats';
import { Testimonials } from '@/components/landing/testimonials';
import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'IFPC — Where talent finds its future',
  description:
    'The global football platform: player development, professional recruitment and matching with clubs, scouts and agents.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white selection:bg-emerald-500/30">
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <Roles />
        <HowItWorks />
        <Features />
        <Stats />
        <Testimonials />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

