import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE ?? '/Genetics/',
    build: { rollupOptions: { input: { app: 'index.html', creatures: 'creature-lab.html' } } }
  };
});
