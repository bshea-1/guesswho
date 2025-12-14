import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../assets/original_characters');
const OUTPUT_DIR = path.join(__dirname, '../public/characters');

const RED_THRESHOLD = 50; // Distance in RGB space to consider "red"
const TARGET_RED = { r: 255, g: 0, b: 0 }; // The red border color

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function processImage(filename) {
  if (!filename.endsWith('.png')) return;

  const inputPath = path.join(INPUT_DIR, filename);
  const outputPath = path.join(OUTPUT_DIR, filename);

  try {
    const originalImage = sharp(inputPath);
    const { width, height } = await originalImage.metadata();

    // Get raw pixel data
    const rawBuffer = await originalImage.ensureAlpha().raw().toBuffer();

    // Iterate through pixels and replace red with transparent
    // This is a naive pixel manipulation for simplicity with sharp raw buffer
    // A more advanced way would be masking, but this is sufficient for solid borders
    for (let i = 0; i < rawBuffer.length; i += 4) {
      const r = rawBuffer[i];
      const g = rawBuffer[i + 1];
      const b = rawBuffer[i + 2];
      // alpha is at i + 3

      // Check distance from pure red
      // Simple Euclidian distance or just check if R is high and G/B are low
      // "Red" border usually is R > 200, G < 50, B < 50
      
      const isRed = (r > 150) && (g < 80) && (b < 80); 
      
      // More precise: Euclidian distance from target
      // const dist = Math.sqrt((r - TARGET_RED.r)**2 + (g - TARGET_RED.g)**2 + (b - TARGET_RED.b)**2);
      // if (dist < RED_THRESHOLD) ...

      if (isRed) {
        rawBuffer[i + 3] = 0; // Set Alpha to 0 (Transparent)
      }
    }

    await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
      .toFile(outputPath);

    console.log(`Processed: ${filename}`);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

async function main() {
  console.log('Starting image processing...');
  const files = fs.readdirSync(INPUT_DIR);
  
  for (const file of files) {
    await processImage(file);
  }
  
  console.log('All images processed!');
}

main();
