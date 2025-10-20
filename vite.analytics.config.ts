import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env file explicitly
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Explicitly define environment variables
      'import.meta.env.VITE_ANALYTICS_GATEWAY_KEY': JSON.stringify(env.VITE_ANALYTICS_GATEWAY_KEY),
      'import.meta.env.VITE_ANALYTICS_GATEWAY_URL': JSON.stringify(env.VITE_ANALYTICS_GATEWAY_URL),
    },
    server: {
      port: 5176, // Analytics standalone port
      strictPort: true,
      open: '/analytics.html',
    },
    build: {
      rollupOptions: {
        input: {
          analytics: path.resolve(__dirname, 'analytics.html'),
        },
      },
    },
  };
});
