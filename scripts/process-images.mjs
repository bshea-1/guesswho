import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../assets/original_characters');
const OUTPUT_DIR = path.join(__dirname, '../public/characters');

// Border thickness as percentage of image dimension
const BORDER_PERCENT = 0.05; // 5% on each side is considered border

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

    // Calculate border regions
    const borderLeft = Math.floor(width * BORDER_PERCENT);
    const borderRight = Math.floor(width * (1 - BORDER_PERCENT));
    const borderTop = Math.floor(height * BORDER_PERCENT);
    const borderBottom = Math.floor(height * (1 - BORDER_PERCENT));

    // Get raw pixel data
    const rawBuffer = await originalImage.ensureAlpha().raw().toBuffer();

    // Iterate through pixels and replace red with transparent ONLY in border regions
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        // Check if pixel is in the border region (not the center content area)
        const isInBorder = (x < borderLeft || x >= borderRight || y < borderTop || y >= borderBottom);

        if (!isInBorder) continue; // Skip center content area

        const r = rawBuffer[i];
        const g = rawBuffer[i + 1];
        const b = rawBuffer[i + 2];

        // Check if pixel is red (R > 150, G < 80, B < 80)
        const isRed = (r > 150) && (g < 80) && (b < 80);

        if (isRed) {
          rawBuffer[i + 3] = 0; // Set Alpha to 0 (Transparent)
        }
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
  console.log(`Border region: ${BORDER_PERCENT * 100}% on each side`);
  const files = fs.readdirSync(INPUT_DIR);

  for (const file of files) {
    await processImage(file);
  }

  console.log('All images processed!');
}

main();

