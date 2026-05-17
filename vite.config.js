import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      // Dev-mode proxy — in Docker/production Nginx handles this
      proxy: {
        '/api/auth': {
          target: env.VITE_AUTH_URL || 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/auth/, ''),
        },
        '/api/products': {
          target: env.VITE_PRODUCT_URL || 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/products/, ''),
        },
        '/api/orders': {
          target: env.VITE_ORDER_URL || 'http://localhost:8083',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/orders/, ''),
        },
        // Also support direct gateway proxy (used when VITE_API_URL=/api)
        '/api': {
          target: env.VITE_GATEWAY_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      // Chunk splitting for better browser caching
      rollupOptions: {
        output: {
          manualChunks: {
            react:    ['react', 'react-dom'],
            router:   ['react-router-dom'],
            query:    ['@tanstack/react-query'],
            motion:   ['framer-motion'],
            zustand:  ['zustand'],
          },
        },
      },
    },
  }
})
