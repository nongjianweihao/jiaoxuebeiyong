import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use a relative base path so the app works when served from the domain root
  // as well as from a sub-directory without needing special configuration.
  // The previous '/coach/' base caused the production bundle to request assets
  // from that absolute path, which resulted in a blank screen when the app was
  // deployed at the root (e.g. http://localhost:5173/) because the JS bundle
  // could not be loaded. With './' Vite emits relative asset URLs that load in
  // both scenarios.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
