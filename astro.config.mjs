// @ts-check
import { defineConfig } from 'astro/config';
import screenshots from './integrations/screenshots.ts';

export default defineConfig({
  integrations: [screenshots()],
});
