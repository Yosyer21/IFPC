import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = ['auth', 'config', 'database', 'matching', 'types', 'validation', 'ui'];

export default defineConfig({
  resolve: {
    alias: [
      ...packages.map((name) => ({
        find: `@ifpc/${name}`,
        replacement: fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url)),
      })),
      // next no declara "exports" para "./server": en Node ESM el import extensionless
      // de next-auth/lib/env.js falla, así que se resuelve contra server.js.
      { find: /^next\/server$/, replacement: 'next/server.js' },
    ],
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'packages/**/src/**/*.test.ts',
      'apps/**/src/**/*.test.ts',
    ],
    testTimeout: 30000,
    server: {
      deps: {
        // next-auth importa "next/server" sin extensión; al inlinearlo pasa por el
        // resolver de vitest (alias) y resuelve correctamente en Node ESM.
        inline: ['next-auth'],
      },
    },
  },
});
