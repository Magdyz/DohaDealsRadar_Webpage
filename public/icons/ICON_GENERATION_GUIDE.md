# PWA Icon Generation Guide

## Current Status
A template SVG icon has been created at `icon-template.svg` with the app's purple theme colors.

## Required Icon Sizes
The following PNG icons need to be generated from the template:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (minimum for PWA)
- 384x384
- 512x512 (recommended for PWA)

## Generation Methods

### Option 1: Using Online Tools (Recommended for Quick Setup)
1. Visit https://realfavicongenerator.net/
2. Upload the `icon-template.svg` or a custom logo
3. Download all generated sizes
4. Place in `/public/icons/` directory

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not available
# Generate all required sizes from SVG
convert icon-template.svg -resize 72x72 icon-72x72.png
convert icon-template.svg -resize 96x96 icon-96x96.png
convert icon-template.svg -resize 128x128 icon-128x128.png
convert icon-template.svg -resize 144x144 icon-144x144.png
convert icon-template.svg -resize 152x152 icon-152x152.png
convert icon-template.svg -resize 192x192 icon-192x192.png
convert icon-template.svg -resize 384x384 icon-384x384.png
convert icon-template.svg -resize 512x512 icon-512x512.png
```

### Option 3: Using Sharp (Node.js)
```bash
npm install sharp-cli -g
sharp -i icon-template.svg -o icon-72x72.png resize 72 72
# Repeat for other sizes
```

## Design Recommendations
- **Colors**: Use primary purple (#C57AF7) and action purple (#9046CF)
- **Content**: Include "DDR" text or a custom logo
- **Background**: Solid color or gradient matching brand
- **Padding**: Keep 10-15% padding around main content for maskable icons
- **Text**: Use bold, clear typography

## Testing Icons
After generating icons, test on:
- Chrome DevTools > Application > Manifest
- iOS Safari (Add to Home Screen)
- Android Chrome (Install App)

## Next Steps
1. Design a custom logo (optional, but recommended)
2. Generate all PNG sizes from the template or custom logo
3. Update manifest.json if icon names change
4. Test PWA installation with generated icons
