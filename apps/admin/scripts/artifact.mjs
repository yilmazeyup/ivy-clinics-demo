// Turns the artifact build into one page fragment for a claude.ai Artifact:
// no doctype, html, head or body (the host adds them), CSS and app code inline,
// React and Three.js from the CDNs the Artifact CSP allows.
// Usage: node scripts/artifact.mjs [output.html]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = resolve(root, 'dist-artifact/assets');
const out = resolve(process.argv[2] ?? resolve(root, 'dist-artifact/pure-ivy-beheer.html'));

const files = readdirSync(assets);
const read = (ext) => {
  const name = files.find((f) => f.endsWith(ext));
  if (!name) throw new Error(`No ${ext} file in ${assets}`);
  return readFileSync(resolve(assets, name), 'utf8');
};
const js = read('.js');
const css = read('.css');
if (/<\/script/i.test(js)) throw new Error('The app code contains "</script" and cannot be inlined.');
if (/<\/style/i.test(css)) throw new Error('The CSS contains "</style" and cannot be inlined.');

const THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1';
const importMap = { imports: { three: `${THREE}/build/three.module.js`, 'three/addons/': `${THREE}/examples/jsm/` } };
const fonts =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Jost:wght@300;400;500&family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500&display=swap';

const page = `<title>Pure Clinics Beheer</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script type="importmap">
${JSON.stringify(importMap, null, 2)}
</script>
<script type="module">
${js}
</script>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log(`${out} (${Math.round(page.length / 1024)} KB)`);
