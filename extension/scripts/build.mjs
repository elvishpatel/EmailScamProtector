import { execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

function log(msg) {
  console.log(`\n\x1b[36m[build]\x1b[0m ${msg}`);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

// Step 1: Clean dist
log('Cleaning dist/...');
if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist, { recursive: true });

// Step 2: Build popup (React app via Vite)
log('Building popup...');
run('npx vite build');

// Step 3: Build content script (vanilla TS → IIFE)
log('Building content script...');
run(
  'npx esbuild src/content/index.ts --bundle --outfile=dist/content-script.js --format=iife --target=chrome110 --loader:.json=json --minify'
);

// Step 4: Build background service worker (TS → ESM)
log('Building service worker...');
run(
  'npx esbuild src/background/service-worker.ts --bundle --outfile=dist/service-worker.js --format=esm --target=chrome110 --loader:.json=json --minify'
);

// Step 5: Copy manifest.json
log('Copying manifest...');
cpSync(
  resolve(root, 'public/manifest.json'),
  resolve(dist, 'manifest.json')
);

// Step 6: Copy or generate icons
log('Setting up icons...');
const iconsSrc = resolve(root, 'public/icons');
const iconsDist = resolve(dist, 'icons');
mkdirSync(iconsDist, { recursive: true });

if (existsSync(iconsSrc)) {
  cpSync(iconsSrc, iconsDist, { recursive: true });
} else {
  // Generate placeholder SVG-based icons for development
  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22C55E"/>
      <stop offset="100%" style="stop-color:#16A34A"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        fill="white" font-family="sans-serif" font-weight="bold"
        font-size="${Math.round(size * 0.45)}">🛡</text>
</svg>`;
    writeFileSync(resolve(iconsDist, `icon-${size}.svg`), svg);
  }
  log('  ⚠ Generated SVG placeholder icons. Replace with PNG files for production.');
}

log('✅ Build complete! Load dist/ as unpacked extension in chrome://extensions');
