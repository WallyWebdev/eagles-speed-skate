// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Site is delivered as a static Astro build to Cloudflare Pages.
// No @astrojs/cloudflare adapter: output is 'static' and Pages serves dist/.
export default defineConfig({
  site: 'https://eagles.wallywebdev.xyz',
  output: 'static',
  integrations: [sitemap()],
  // Fonts are self-hosted via @fontsource, so no external requests at runtime.
});
