import { defineConfig } from 'vite';

export default defineConfig({
  // Production build: target ES2015 so esbuild transpiles any remaining
  // modern syntax (optional chaining, nullish coalescing, etc.) down to
  // something that works on older iOS Safari / Android WebView on Netlify.
  build: {
    target: 'es2015'
  },

  // Dev server: expose on all network interfaces so you can test on a
  // phone on the same Wi-Fi without needing --host flag.
  server: {
    host: true,
    port: 5173
  }
});
