/**
 * Favicon Generator Script
 *
 * Generates standard favicon sizes (16x16, 32x32) from the SVG template
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TEMPLATE_PATH = path.join(ICONS_DIR, 'icon-template.svg');

async function generateFavicons() {
  console.log('🎨 Generating favicons...\n');

  const svgBuffer = fs.readFileSync(TEMPLATE_PATH);

  // Generate 16x16 favicon
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  console.log('✅ Generated: favicon-16x16.png');

  // Generate 32x32 favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  console.log('✅ Generated: favicon-32x32.png');

  // Generate ICO file (combining 16x16 and 32x32)
  // Note: ICO generation requires additional library, using PNG as fallback
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
  console.log('✅ Generated: favicon.ico');

  console.log('\n✨ Favicon generation complete!');
}

generateFavicons().catch(console.error);
