import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Ensures assets load correctly on GitHub Pages under any subpath
  build: {
    // Bestiary catalogs are intentionally lazy-loaded data chunks. The 5e24
    // chunk is ~1.8 MB minified (~250 KB gzip), while the complete 2875-entry
    // 5e14 catalog is ~10 MB minified (~1.6 MB gzip). It is downloaded only
    // when the user opens the 5e14 tab.
    chunkSizeWarningLimit: 11000,
  },
});
