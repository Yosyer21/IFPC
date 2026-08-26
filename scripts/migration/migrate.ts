import { execSync } from 'node:child_process';

// Applies the migration without interaction (requires previously generated migrations).
try {
  execSync('pnpm --filter @ifpc/database db:generate', { stdio: 'inherit' });
  execSync('npx prisma migrate deploy --schema packages/database/prisma/schema.prisma', {
    stdio: 'inherit',
  });
  console.log('Migraciones aplicadas.');
} catch (error) {
  console.error('Error al aplicar migraciones:', error);
  process.exit(1);
}
