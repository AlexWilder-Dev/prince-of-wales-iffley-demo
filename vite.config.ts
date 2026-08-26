import { defineConfig } from 'vite';

// GitHub project pages serve from https://<user>.github.io/prince-of-wales-iffley-demo/
export default defineConfig({
  base: '/prince-of-wales-iffley-demo/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
