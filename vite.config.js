/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  test: {
    // Exclude macOS AppleDouble metadata files (T7 ExFAT drives create these)
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*'],
  },
})
