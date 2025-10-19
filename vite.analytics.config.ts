import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174, // Different port for analytics
    open: '/analytics.html',
  },
  build: {
    rollupOptions: {
      input: {
        analytics: path.resolve(__dirname, 'analytics.html'),
      },
    },
  },
});
