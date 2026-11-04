import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist/**',
    'mcp/dist/**',
    '.cache/**',
    '.sites-runtime/**',
    'playwright-report/**',
    'test-results/**',
    'public/**',
  ]),
  {
    files: ['**/*.{ts,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.strict],
  },
]);
