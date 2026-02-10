import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/discord-proxy': {
        target: 'https://cdn.discordapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/discord-proxy/, ''),
      },
    },
  },
})
