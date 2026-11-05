import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// In an ESM context there is no `__dirname`, so we derive it from `import.meta.url`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
// Dev proxy lets us call /api and /socket.io from the browser without CORS issues
// because the Express backend (port 5000) serves the same cookies.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward every REST call under /api to the Express backend.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Forward the Socket.io engine so cookies + websocket work locally.
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
