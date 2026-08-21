import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Contacto — Future Buller',
  description: 'Ponte en contacto con el equipo de Future Buller.',
};

const CHANNELS = [
  {
    label: 'Soporte general',
    value: 'hola@futurebuller.com',
    href: 'mailto:hola@futurebuller.com',
  },
  {
    label: 'Clubes y academias',
    value: 'clubs@futurebuller.com',
    href: 'mailto:clubs@futurebuller.com',
  },
  {
    label: 'Universidades',
    value: 'universities@futurebuller.com',
    href: 'mailto:universities@futurebuller.com',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Contact</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Hablemos</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            ¿Tienes dudas sobre la plataforma, quieres incorporar a tu club o universidad, o
            necesitas ayuda con tu cuenta? Escríbenos y te responderemos en menos de 48 horas.
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
          <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <h3 className="font-medium">¿Cómo creo mi perfil de jugador?</h3>
              <p className="mt-1 text-muted-foreground">
                Regístrate gratis, completa tu perfil deportivo y sube vídeos. Tu perfil quedará
                visible para clubes y ojeadores.
              </p>
            </div>
            <div>
              <h3 className="font-medium">¿Qué papel juegan las familias?</h3>
              <p className="mt-1 text-muted-foreground">
                Puedes vincular a tus hijos desde una cuenta familiar y seguir su desarrollo,
                evaluaciones y oportunidades en un hub privado.
              </p>
            </div>
            <div>
              <h3 className="font-medium">¿Cuánto cuesta?</h3>
              <p className="mt-1 text-muted-foreground">
                La creación de perfil es gratuita. Las membresías premium desbloquean funciones
                avanzadas de visibilidad y reclutamiento.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


