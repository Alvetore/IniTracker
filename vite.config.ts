import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Ensures assets load correctly on GitHub Pages under any subpath
  build: {
    // The full 5e24 catalog is intentionally a lazy-loaded chunk (~2 MB minified,
    // ~290 KB gzip). The warning threshold is raised for this known data bundle.
    chunkSizeWarningLimit: 2100,
  },
});
