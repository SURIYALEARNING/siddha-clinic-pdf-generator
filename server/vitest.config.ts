import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./__tests__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.ts'],
      exclude: ['__tests__/**', 'dist/**', 'node_modules/**'],
    },
  },
});
