// @ts-check
import { defineConfig } from 'astro/config';
import screenshots from './integrations/screenshots.ts';

export default defineConfig({
  site: 'https://web-experiments.openhomefoundation.org',
  integrations: [screenshots()],
});
