import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Code splitting for better caching and performance
        rollupOptions: {
          output: {
            manualChunks: {
              // Core React libraries
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              // Animation libraries
              'vendor-animation': ['framer-motion', 'gsap'],
              // Form handling
              'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
              // UI utilities
              'vendor-ui': ['lucide-react'],
            },
          },
        },
        // Increase chunk size warning limit (optional)
        chunkSizeWarningLimit: 600,
        // Enable source maps for production debugging
        sourcemap: mode === 'production' ? 'hidden' : true,
      },
    };
});
