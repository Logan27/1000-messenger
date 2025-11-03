import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for react and react-dom
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate chunk for socket.io client
          'socket-vendor': ['socket.io-client'],
          // Separate chunk for state management
          'state-vendor': ['zustand'],
        },
      },
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
  },
});
