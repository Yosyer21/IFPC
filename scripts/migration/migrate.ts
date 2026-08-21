import { execSync } from 'node:child_process';

// Aplica la migración sin interacción (requiere migrations generadas previamente).
try {
  execSync('pnpm --filter @future-buller/database db:generate', { stdio: 'inherit' });
  execSync('npx prisma migrate deploy --schema packages/database/prisma/schema.prisma', {
    stdio: 'inherit',
  });
  console.log('Migraciones aplicadas.');
} catch (error) {
  console.error('Error al aplicar migraciones:', error);
  process.exit(1);
}
