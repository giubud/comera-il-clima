import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: { ssr: 'src/index.ts', outDir: 'dist', target: 'node22' },
  ssr: { external: ['@modelcontextprotocol/sdk', 'zod'] },
});
