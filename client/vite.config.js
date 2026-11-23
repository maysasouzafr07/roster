import { defineConfig } from 'vite';

// Em desenvolvimento, as chamadas /api vao para o servidor Node (porta 3001)
export default defineConfig({
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } }
});
