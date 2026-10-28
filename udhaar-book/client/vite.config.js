import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the app runs on :5173 and forwards /api calls to the server on :5000.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
});
