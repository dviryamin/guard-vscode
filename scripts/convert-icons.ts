import sharp from 'sharp';
import fs from 'fs';
import path from 'path';


const iconsDir = path.join(__dirname, '..', 'icons');
const svgPath = path.join(iconsDir, 'guard-icon.svg');
const pngPath = path.join(iconsDir, 'guard-icon.png');

// Convert SVG to 32x32 PNG
sharp(svgPath)
  .resize(32, 32)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✓ Successfully converted guard-icon.svg to 32x32 PNG');
  })
  .catch((err: Error) => {
    console.error('Error converting icon:', err);
    process.exit(1);
  });
