import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Contact — IFPC',
  description: 'Get in touch with the IFPC team.',
};

const CHANNELS = [
  {
    label: 'General support',
    value: 'hola@ifpc.com',
    href: 'mailto:hola@ifpc.com',
  },
  {
    label: 'Clubs and academies',
    value: 'clubs@ifpc.com',
    href: 'mailto:clubs@ifpc.com',
  },
  {
    label: 'Universities',
    value: 'universities@ifpc.com',
    href: 'mailto:universities@ifpc.com',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Contact</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Let\u2019s talk</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Do you have questions about the platform, want to onboard your club or university, or
            need help with your account? Write to us and we will reply within 48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              className="group rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-emerald-500/50"
            >
              <div className="text-xs text-muted-foreground">{channel.label}</div>
              <div className="mt-2 font-semibold group-hover:text-emerald-400">{channel.value}</div>
            </a>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border/60 bg-card p-8">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <h3 className="font-medium">How do I create my player profile?</h3>
              <p className="mt-1 text-muted-foreground">
                Sign up for free, complete your sports profile and upload videos. Your profile will
                be visible to clubs and scouts.
              </p>
            </div>
            <div>
              <h3 className="font-medium">What role do families play?</h3>
              <p className="mt-1 text-muted-foreground">
                You can link your children from a family account and follow their development,
                assessments and opportunities in a private hub.
              </p>
            </div>
            <div>
              <h3 className="font-medium">How much does it cost?</h3>
              <p className="mt-1 text-muted-foreground">
                Creating a profile is free. Premium memberships unlock advanced visibility and
                recruitment features.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


