import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = ['auth', 'config', 'database', 'matching', 'types', 'validation', 'ui'];

export default defineConfig({
  resolve: {
    alias: packages.map((name) => ({
      find: `@ifpc/${name}`,
      replacement: fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url)),
    })),
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'packages/**/src/**/*.test.ts',
      'apps/**/src/**/*.test.ts',
    ],
    testTimeout: 30000,
  },
});
