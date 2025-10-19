import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to serve admin.html at root
function serveAdminHtml(): Plugin {
  return {
    name: 'serve-admin-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          const adminHtmlPath = path.resolve(__dirname, 'admin.html');
          const html = fs.readFileSync(adminHtmlPath, 'utf-8');
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveAdminHtml()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'admin.html'),
      },
    },
    outDir: 'dist-admin',
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  root: '.',
});
