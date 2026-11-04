import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.cache/**', 'mcp/**', 'tests/e2e.spec.ts'],
  },
});
