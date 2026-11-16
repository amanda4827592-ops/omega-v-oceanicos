import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        // Browser calls such as /api/tensor/4 reach Fastify as /tensor/4.
        rewrite: (path) => path.replace(/^\/api(?=\/)/, ''),
      },
    },
  },
  preview: {
    allowedHosts: process.env.VITE_ALLOWED_HOST
      ? [process.env.VITE_ALLOWED_HOST]
      : ['3000-iscjvtugzf1ft862z9fi7-08dbc251.us4.manus.computer'],
  },
});
