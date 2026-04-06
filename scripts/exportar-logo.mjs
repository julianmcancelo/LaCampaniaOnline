import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

const svgBase = readFileSync(resolve(raiz, 'public/logo.svg'));

// SVG sin fondo (para android foreground transparente)
const svgTransparente = Buffer.from(
  svgBase.toString().replace(
    '<circle cx="100" cy="100" r="96" fill="#0d2318"/>',
    '<circle cx="100" cy="100" r="96" fill="none"/>'
  )
);

// SVG para splash (fondo verde oscuro, logo centrado pequeño)
const svgSplash = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="96" fill="#0d2318"/>
  <circle cx="100" cy="100" r="96" fill="none" stroke="#d4a017" stroke-width="4"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="#d4a017" stroke-width="1" opacity="0.5"/>
  <text x="100" y="119" font-family="Georgia, serif" font-size="74" font-weight="bold"
        fill="#d4a017" text-anchor="middle" letter-spacing="-3">LC</text>
  <line x1="60" y1="135" x2="140" y2="135" stroke="#d4a017" stroke-width="1.5" opacity="0.7"/>
</svg>
`);

const salidas = [
  {
    svg: svgBase,
    tamano: 1024,
    destino: 'apps/mobile/assets/images/icon.png',
    descripcion: 'App icon 1024×1024',
  },
  {
    svg: svgSplash,
    tamano: 200,
    destino: 'apps/mobile/assets/images/splash-icon.png',
    descripcion: 'Splash icon 200×200',
  },
  {
    svg: svgBase,
    tamano: 64,
    destino: 'apps/mobile/assets/images/favicon.png',
    descripcion: 'Favicon 64×64',
  },
  {
    svg: svgTransparente,
    tamano: 1024,
    destino: 'apps/mobile/assets/images/android-icon-foreground.png',
    descripcion: 'Android foreground 1024×1024 (transparente)',
  },
];

for (const { svg, tamano, destino, descripcion } of salidas) {
  const rutaDestino = resolve(raiz, destino);
  await sharp(svg)
    .resize(tamano, tamano)
    .png()
    .toFile(rutaDestino);
  console.log(`✓ ${descripcion} → ${destino}`);
}

console.log('\nLogos exportados correctamente.');
