import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/characters');
const OUTPUT_FILE = path.join(__dirname, '../lib/characters.ts');
const MANIFEST_FILE = path.join(__dirname, '../assets/original_characters/manifest.txt');

// Ensure lib directory exists
const libDir = path.join(__dirname, '../lib');
if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir);
}

function getCharacters() {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png'));

    return files.map((file, index) => {
        const name = path.basename(file, '.png');
        // Basic ID generation
        const id = name.toLowerCase();

        // Randomize attributes for demo purposes since we can't see the images
        const hairColors = ['Black', 'Brown', 'Blonde', 'Red', 'White'];
        const eyeColors = ['Brown', 'Blue', 'Green'];

        // Deterministic random based on name length/char codes to be consistent across server/client regenerations if script runs again
        const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const rand = (n) => (seed * n + index) % 1; // Simple pseudo-rand

        const attributes = {
            gender: (seed + index) % 2 === 0 ? 'Male' : 'Female',
            hairColor: hairColors[(seed + index) % hairColors.length],
            glasses: (seed * index) % 3 === 0, // 33% chance
            hat: (seed * index + 1) % 4 === 0, // 25% chance
            facialHair: (seed + index) % 2 === 0 && (seed + index) % 2 === 0, // Males only? Simplified
        };

        return {
            id,
            name,
            image: `/characters/${file}`,
            attributes
        };
    });
}

const characters = getCharacters();

const fileContent = `export type CharacterAttributes = {
  gender: string;
  hairColor: string;
  glasses: boolean;
  hat: boolean;
  facialHair: boolean;
  [key: string]: any;
};

export type Character = {
  id: string;
  name: string;
  image: string;
  attributes: CharacterAttributes;
};

export const CHARACTERS: Character[] = ${JSON.stringify(characters, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, fileContent);
console.log(`Generated ${characters.length} characters in ${OUTPUT_FILE}`);
