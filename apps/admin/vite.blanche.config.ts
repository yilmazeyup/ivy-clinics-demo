import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Blanche Beauty's admin panel: its own page in blanche/, sharing this package's React, Three.js and the 3D stage.
export default defineConfig({
  root: 'blanche',
  plugins: [react()],
  server: { port: 5182, strictPort: true },
  preview: { port: 5183, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
