import { defineConfig } from 'vite';

export default defineConfig({
  // Dev server: expose on all network interfaces so you can test on a
  // phone on the same Wi-Fi without needing --host flag.
  server: {
    host: true,
    port: 5173
  }
});
