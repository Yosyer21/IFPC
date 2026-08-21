import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'About — Future Buller',
  description:
    'Future Buller conecta talento con oportunidades: desarrollo, scouting y reclutamiento en un solo lugar.',
};

const VALUES = [
  {
    title: 'Talento primero',
    description:
      'Cada jugador tiene un perfil único. Ayudamos a que su nivel y potencial se vean con claridad.',
  },
  {
    title: 'Transparencia',
    description:
      'Clubes, ojeadores y agentes evalúan con datos reales: evaluaciones, vídeos y métricas.',
  },
  {
    title: 'Sin fronteras',
    description:
      'De categoría base a profesional y universitario. El futuro del jugador no depende del código postal.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">About</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Donde el talento encuentra su futuro
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Future Buller es una plataforma global de fútbol que une a jugadores, familias,
            entrenadores, clubes, agentes, ojeadores y universidades. Perfil deportivo, plan de
            desarrollo, pruebas, becas y contratos: todo el recorrido profesional del jugador en un
            solo ecosistema.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-border/60 bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-emerald-400">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">¿Eres jugador o representas a un club?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Crea tu perfil y empieza a recibir oportunidades que se ajustan a tu nivel.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Crear cuenta
            </Link>
            <Link
              href="/opportunities"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              Ver oportunidades
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


