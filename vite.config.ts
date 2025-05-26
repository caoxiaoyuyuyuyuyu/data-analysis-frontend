// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // 强制透传所有请求头
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 透传所有原始请求头
            const headers = req.headers;
            Object.keys(headers).forEach((key) => {
              proxyReq.setHeader(key, headers[key]);
            });
          });
        }
      },
    },
  },
});