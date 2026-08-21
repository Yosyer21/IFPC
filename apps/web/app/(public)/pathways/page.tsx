import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Rutas de desarrollo — Future Buller',
  description: 'El camino del jugador: de categoría base a profesional y universitario.',
};

const STAGES = [
  {
    id: 'base',
    title: 'Categoría base',
    age: '6–14 años',
    focus: 'Técnica individual, coordinación y hábitos de entrenamiento.',
  },
  {
    id: 'formacion',
    title: 'Formación',
    age: '14–17 años',
    focus: 'Táctica, físico y competición. Primeros trials y visorías.',
  },
  {
    id: 'profesional',
    title: 'Pre-profesional',
    age: '17–21 años',
    focus: 'Rendimiento, becas universitarias y primeros contratos.',
  },
  {
    id: 'universitario',
    title: 'Universitario / Pro',
    age: '18+ años',
    focus: 'Becas académico-deportivas o contratos profesionales.',
  },
];

export default function PathwaysPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Pathways
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">El camino del jugador</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Cada jugador avanza por etapas. Future Buller estructura ese recorrido con evaluaciones,
            objetivos y oportunidades: desde la primera escuela de fútbol hasta la beca universitaria
            o el contrato profesional.
          </p>
        </div>

        <div className="mb-12 flex flex-col gap-4">
          {STAGES.map((stage, index) => (
            <div key={stage.id} className="flex flex-wrap items-center gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-400">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{stage.title}</h2>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                    {stage.age}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{stage.focus}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Empieza tu ruta hoy</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Crea tu perfil y recibe un plan de desarrollo adaptado a tu etapa y posición.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
          >
            Crear cuenta
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}


