import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hoopsnakedesigns.com',
  output: 'static',
  outDir: 'dist',
  build: {
    inlineStylesheets: 'auto',
  },
});
