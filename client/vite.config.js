import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When running inside Docker, the API is reachable via the service name 'api'.
// When running locally, it's on localhost:5000.
const API_HOST = process.env.VITE_API_HOST || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Needed so Docker can expose the port to the host
    proxy: {
      '/api': {
        target: API_HOST,
        changeOrigin: true
      },
      '/socket.io': {
        target: API_HOST,
        ws: true,
        changeOrigin: true
      }
    }
  }
});
