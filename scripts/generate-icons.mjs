/**
 * Rasterizes public/favicon.svg into every icon format the desktop and
 * Android builds need. Run with: npm run icons
 *
 * Outputs:
 *  - build/icon.png            512x512   electron-builder (exe icon)
 *  - assets/icon.png           1024x1024 @capacitor/assets source icon
 *  - assets/icon-foreground.png 1024x1024 adaptive icon foreground (swords only)
 *  - assets/icon-background.png 1024x1024 adaptive icon background (gradient)
 *  - assets/splash.png         2732x2732 Android splash (icon on dark slate)
 */
import { readFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(process.cwd());
const svgSource = await readFile(path.join(root, 'public', 'favicon.svg'), 'utf-8');

// Split the SVG into reusable layers: the rounded gradient tile and the swords group.
const gradientMatch = svgSource.match(/<linearGradient[\s\S]*?<\/linearGradient>/);
const swordsMatch = svgSource.match(/<g transform="[^"]*"[\s\S]*?<\/g>/);
if (!gradientMatch || !swordsMatch) {
  throw new Error('favicon.svg structure changed: could not find gradient or swords group');
}
const gradient = gradientMatch[0];
const swords = swordsMatch[0];

const svg = (body, size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${body}</svg>`;

const fullTile = `<defs>${gradient}</defs><rect width="64" height="64" rx="14" fill="url(#bg)"/>`;
const backgroundOnly = svg(fullTile, 1024);
// Scale the swords to ~70% and center them inside the adaptive-icon safe zone.
// The artwork spans roughly 3..21 of the original 24-unit grid, so the
// translate centers that span within the 64-unit canvas.
const foregroundOnly = svg(
  `<g transform="translate(11 11) scale(2.326)" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${swords.replace(/^<g[^>]*>|<\/g>$/g, '')}</g>`,
  1024
);

await mkdir(path.join(root, 'build'), { recursive: true });
await mkdir(path.join(root, 'assets'), { recursive: true });

const rendered = await sharp(Buffer.from(svgSource)).resize(512, 512).png().toBuffer();
await sharp(rendered).toFile(path.join(root, 'build', 'icon.png'));

const icon1024 = await sharp(Buffer.from(svgSource)).resize(1024, 1024).png().toBuffer();
await sharp(icon1024).toFile(path.join(root, 'assets', 'icon.png'));

await sharp(Buffer.from(backgroundOnly)).png().toFile(
  path.join(root, 'assets', 'icon-background.png')
);
await sharp(Buffer.from(foregroundOnly)).png().toFile(
  path.join(root, 'assets', 'icon-foreground.png')
);

const splashBg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="#020617"/></svg>`
);
await sharp(splashBg)
  .composite([{ input: await sharp(icon1024).resize(768, 768).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(path.join(root, 'assets', 'splash.png'));

console.log('Icons generated: build/icon.png, assets/icon*.png, assets/splash.png');
