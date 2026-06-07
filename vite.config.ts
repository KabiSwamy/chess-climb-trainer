import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The puzzle database is inlined, which pushes the single chunk over the
  // default 500 kB warning threshold. That's expected for this static app.
  build: { chunkSizeWarningLimit: 800 },
})
