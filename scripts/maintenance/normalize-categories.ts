// Deja las categorías de evaluación en su forma canónica (`technical`, `physical`,
// `tactical`, `psychological`).
//
// Por qué: los datos antiguos guardados en español (o con el nombre largo) ya se
// muestran bien — la app los normaliza al leer — pero conviene limpiarlos para que
// las consultas por categoría no devuelvan filas duplicadas.
//
// Uso:
//   pnpm scripts:normalize-categories                    # informe (no escribe nada)
//   pnpm scripts:normalize-categories -- --apply         # aplica los cambios
//
// Con PGlite (`USE_PGLITE=true`) hay que parar `pnpm dev` antes de lanzarlo: la base
// embebida no admite dos procesos a la vez.
import { prisma } from '@ifpc/database';
import { planCategoryNormalization } from '../../apps/web/lib/player-development';

const apply = process.argv.includes('--apply');

async function main() {
  const evaluations = await prisma.evaluation.findMany({ select: { id: true, category: true } });
  const { changes, unchanged } = planCategoryNormalization(evaluations);

  if (changes.length === 0) {
    console.log(
      `Nada que normalizar: las ${unchanged} evaluaciones ya tienen una categoría canónica.`
    );
    return;
  }

  // Resumen agrupado por cambio («psicológica → psychological: 3»).
  const summary = new Map<string, number>();
  for (const change of changes) {
    const key = `${change.from} → ${change.to}`;
    summary.set(key, (summary.get(key) ?? 0) + 1);
  }

  console.log(`${changes.length} de ${evaluations.length} evaluaciones con categoría no canónica:`);
  for (const [key, count] of summary) console.log(`  ${key}: ${count}`);

  if (!apply) {
    console.log('\nInforme sin cambios. Añade `--apply` para guardarlos.');
    return;
  }

  for (const change of changes) {
    await prisma.evaluation.update({ where: { id: change.id }, data: { category: change.to } });
  }
  console.log(`\nActualizadas ${changes.length} evaluaciones.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
