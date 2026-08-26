// ESLint flat config para la app web (Next.js 15)
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'out/**', 'next-env.d.ts', 'public/**'],
  },
  {
    rules: {
      // English text legitimately uses apostrophes in JSX (e.g. "player's profile").
      'react/no-unescaped-entities': ['error', { forbid: ['>', '"', '}'] }],
    },
  },
];

export default config;
