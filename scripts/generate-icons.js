/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from the SVG template.
 * It uses Sharp (already installed as a dependency) to convert SVG to PNG
 * with various sizes required for Progressive Web App installation.
 *
 * Usage: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const TEMPLATE_PATH = path.join(ICONS_DIR, 'icon-template.svg');

/**
 * Generate PNG icons from SVG template
 */
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Check if template exists
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('❌ Error: icon-template.svg not found at', TEMPLATE_PATH);
    console.log('Please create an SVG icon template first.');
    process.exit(1);
  }

  // Read SVG template
  const svgBuffer = fs.readFileSync(TEMPLATE_PATH);

  // Generate each size
  for (const size of ICON_SIZES) {
    try {
      const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated icons in /public/icons/');
  console.log('2. (Optional) Replace icon-template.svg with custom logo');
  console.log('3. Run this script again to regenerate with custom logo');
  console.log('4. Test PWA installation on mobile devices');
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
