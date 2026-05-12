/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // sqlite-wasm must not be pre-bundled — it loads its own wasm
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    passWithNoTests: true,
  },
})
