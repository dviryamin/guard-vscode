import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconsDir = path.join(__dirname, '..', 'icons');
const svgPath = path.join(iconsDir, 'guard-icon.svg');

// Icon sizes for different purposes
const iconSizes = [
  { size: 128, name: 'guard-icon-128.png', description: 'Extension marketplace icon' },
  { size: 32, name: 'guard-icon-32.png', description: 'Language icon' },
  { size: 16, name: 'guard-icon-16.png', description: 'Small UI elements' },
];

// Convert SVG to multiple PNG sizes
Promise.all(
  iconSizes.map(({ size, name, description }) =>
    sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, name))
      .then(() => {
        console.log(`✓ Successfully converted guard-icon.svg to ${size}x${size} PNG (${description})`);
      })
  )
)
  .then(() => {
    console.log('\n✓ All icons generated successfully!');
  })
  .catch((err: Error) => {
    console.error('Error converting icons:', err);
    process.exit(1);
  });
