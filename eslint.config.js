// ESLint flat config (raíz del monorepo)
// Cada app/paquete puede tener su propio eslint.config.* (cascada flat).
module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/public/**',
    ],
  },
];
