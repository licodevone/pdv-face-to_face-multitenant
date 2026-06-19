import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    globals: true,
    exclude: [
      '**/tests/e2e/**', 
      '**/node_modules/**', 
      '**/dist/**'
    ],
  },
});
