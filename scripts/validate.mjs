// Post-build verification for the Eagles Speed Skate static site.
// Run after `npm run build`. Verifies built output: routes, SEO metadata,
// canonical/OG/JSON-LD, internal anchors, sitemap, robots, headers, llms.txt,
// the Come & Try content, and forbidden-content checks.
//
// Exits non-zero on any failure so it can gate a release.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');

const failures = [];
const checks = [];

function check(name, cond, detail = '') {
  if (cond) checks.push(`✓ ${name}`);
  else failures.push(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel) {
  const p = join(dist, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

// 1. Build output exists
check('dist/ exists', existsSync(dist));
if (!existsSync(dist)) {
  console.error('dist/ missing — run `npm run build` first.');
  process.exit(1);
}

const html = read('index.html') ?? '';
check('index.html present', html.length > 0);

// 2. Required meta/markers in HTML
check('title contains Eagles Speed Skate', /Eagles Speed Skate/.test(html));
check('meta description present', /<meta name="description" content="[^"]+/i.test(html));
check('canonical link present', /<link rel="canonical" href="[^"]+"/i.test(html));
check('og:title present', /property="og:title"/i.test(html));
check('og:description present', /property="og:description"/i.test(html));
check('og:image present', /property="og:image"/i.test(html));
check('JSON-LD SportsTeam present', /"@type"\s*:\s*"SportsTeam"/.test(html));

// 3. Internal anchors resolve to real section ids
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const id of ['top', 'about', 'programs', 'gallery', 'schedule', 'try', 'join']) {
  check(`section id #${id} exists`, ids.has(id));
}

// 4. Nav + footer + CTA links
check('nav links to #try', /href="#try"/.test(html));
check('join CTA present', /href="#join"/.test(html));
check('main club external link present', /eaglesrollersports\.com\.au/.test(html));

// 5. Come & Try content
check('helmet requirement present', /helmet/i.test(html));
check('Skate Australia member requirement present', /Skate Australia member/i.test(html));
const trialHref = (html.match(/href="(https:\/\/www\.skateaustralia\.org\.au\/three-weekfreetrial)"/i) || [])[1];
check('3-week trial link correct', trialHref === 'https://www.skateaustralia.org.au/three-weekfreetrial', trialHref ?? 'missing');

// 6. Forbidden content: only "not ice speed skating" is allowed
const iceStandalone = /(?<![a-z] )ice speed skating/i.test(html.replace(/not ice speed skating/gi, ''));
check('no standalone "ice speed skating" claim', !iceStandalone);
// No fabricated contact/schedule markers
check('no fabricated email', !/[\w.+-]+@[\w-]+\.[\w.-]+/.test(html));

// 7. Sitemap
const sitemapIndex = read('sitemap-index.xml');
check('sitemap-index.xml present', !!sitemapIndex, 'missing');
if (sitemapIndex) {
  const m = sitemapIndex.match(/<loc>([^<]+)<\/loc>/);
  check('sitemap-index references a sitemap', !!m, 'no <loc>');
  if (m) {
    const sub = m[1].split('/').pop();
    const subContent = read(sub);
    check('sitemap contains site URL', subContent ? /eagles\.wallywebdev\.xyz/.test(subContent) : false, 'missing url');
    check('sitemap contains root route', subContent ? /\/<\/loc>/.test(subContent) : false);
  }
}

// 8. robots.txt disallows indexing (dev site)
const robots = read('robots.txt');
check('robots.txt present', !!robots);
check('robots.txt disallows all', robots ? /Disallow:\s*\//i.test(robots) : false);

// 9. _headers: noindex + CSP
const headers = read('_headers');
check('_headers present', !!headers);
check('_headers noindex set', headers ? /X-Robots-Tag:\s*noindex,\s*nofollow/i.test(headers) : false);
check('_headers CSP set', headers ? /Content-Security-Policy:/i.test(headers) : false);

// 10. llms.txt
check('llms.txt present', !!read('llms.txt'));

// Report
console.log('\n=== Eagles build verification ===');
for (const c of checks) console.log(c);
if (failures.length) {
  console.error('\nFAILURES:');
  for (const f of failures) console.error(f);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
