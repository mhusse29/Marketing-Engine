import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/Marketing-Engine/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/ai': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
});
