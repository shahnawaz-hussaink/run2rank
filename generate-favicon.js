// Simple script to generate favicon
// Run: node generate-favicon.js

const fs = require('fs');
const path = require('path');

// Create a simple 16x16 ICO file with pyFit branding
// This is a basic ICO format with a blue/purple gradient placeholder
const createSimpleIco = () => {
  // ICO file header (6 bytes)
  const header = Buffer.from([
    0x00, 0x00,  // Reserved
    0x01, 0x00,  // Type: 1 for ICO
    0x01, 0x00   // Number of images: 1
  ]);

  // Image directory entry (16 bytes)
  const imageDir = Buffer.from([
    16,          // Width (16px)
    16,          // Height (16px)
    0,           // Color palette
    0,           // Reserved
    1, 0,        // Color planes
    32, 0,       // Bits per pixel
    0, 0, 0, 0,  // Size of image data (will update)
    22, 0, 0, 0  // Offset to image data
  ]);

  // Create a simple 16x16 RGBA bitmap with blue/purple gradient
  const pixels = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Calculate distance from center for circular shape
      const dx = x - 8;
      const dy = y - 8;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 7.5) {
        // Blue to purple gradient
        const ratio = x / 16;
        const r = Math.floor(59 + (139 - 59) * ratio);  // 0x3b to 0x8b
        const g = Math.floor(130 - (130 - 92) * ratio); // 0x82 to 0x5c
        const b = Math.floor(246);                       // 0xf6
        pixels.push(b, g, r, 255); // BGRA format
      } else {
        pixels.push(0, 0, 0, 0); // Transparent
      }
    }
  }

  const bitmapData = Buffer.from(pixels);
  
  // BMP header for ICO
  const bmpHeader = Buffer.from([
    40, 0, 0, 0,  // Header size
    16, 0, 0, 0,  // Width
    32, 0, 0, 0,  // Height (doubled for ICO format)
    1, 0,         // Planes
    32, 0,        // Bits per pixel
    0, 0, 0, 0,   // Compression
    0, 0, 0, 0,   // Image size (can be 0 for uncompressed)
    0, 0, 0, 0,   // X pixels per meter
    0, 0, 0, 0,   // Y pixels per meter
    0, 0, 0, 0,   // Colors used
    0, 0, 0, 0    // Important colors
  ]);

  const imageData = Buffer.concat([bmpHeader, bitmapData]);
  
  // Update image size in directory
  imageDir.writeUInt32LE(imageData.length, 8);

  return Buffer.concat([header, imageDir, imageData]);
};

const icoPath = path.join(__dirname, 'client', 'public', 'favicon.ico');
fs.writeFileSync(icoPath, createSimpleIco());

console.log('✓ Generated favicon.ico successfully!');
console.log('  Location:', icoPath);
