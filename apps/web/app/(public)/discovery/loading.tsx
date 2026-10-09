import { FeedSkeleton } from '@/components/discovery/feed-skeleton';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';

/** Esqueleto del espejo público mientras el servidor prepara el feed. */
export default function PublicDiscoveryLoading() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <p className="mb-6 text-sm text-muted-foreground">Discovery</p>
        <FeedSkeleton posts={3} />
      </main>
      <Footer />
    </div>
  );
}
