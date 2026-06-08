import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@charwizard-core': resolve(__dirname, '../charwizard-core/src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/module.ts'),
      name: 'charwizardVeilrunner',
      fileName: 'charwizard-veilrunner',
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: { external: [] },
    target: 'es2022',
    minify: false,
    sourcemap: true,
  },
});
