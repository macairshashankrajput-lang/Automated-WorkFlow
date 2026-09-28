import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@goldenprime': path.resolve(import.meta.dirname, 'GoldenPrime-Stay-app-main'),
      '@vernika': path.resolve(import.meta.dirname, 'Vernika-app-main/src'),
      '@chakna': path.resolve(import.meta.dirname, 'chaknastore-FoodDeliveryapp-main'),
      '@website': path.resolve(import.meta.dirname, 'vernika-website-main'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
