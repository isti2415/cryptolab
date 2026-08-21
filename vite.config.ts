import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { codeSamples } from './plugins/stripComments';

export default defineConfig({
  plugins: [react(), codeSamples()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    /*
     * Engines are pure and run fastest in Node; only the component tests need a
     * DOM. Rather than paying for jsdom on all 400-odd engine assertions, files
     * opt in with `// @vitest-environment jsdom` at the top.
     */
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
