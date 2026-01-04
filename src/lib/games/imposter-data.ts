// Secret Word / Hint Word pairs for Imposter game mode
// The hint gives the imposter a general idea of the category/theme

export const IMPOSTER_WORD_PAIRS: { secret: string; hint: string }[] = [
    // Food & Drink
    { secret: 'Pineapple', hint: 'Fruit' },
    { secret: 'Spaghetti', hint: 'Pasta' },
    { secret: 'Sushi', hint: 'Japanese Food' },
    { secret: 'Croissant', hint: 'Breakfast' },
    { secret: 'Taco', hint: 'Mexican Food' },
    { secret: 'Espresso', hint: 'Coffee' },
    { secret: 'Champagne', hint: 'Celebration Drink' },

    // Animals
    { secret: 'Elephant', hint: 'Safari Animal' },
    { secret: 'Penguin', hint: 'Bird' },
    { secret: 'Dolphin', hint: 'Ocean Animal' },
    { secret: 'Kangaroo', hint: 'Australian Animal' },
    { secret: 'Chameleon', hint: 'Reptile' },

    // Music & Instruments
    { secret: 'Guitar', hint: 'Instrument' },
    { secret: 'Saxophone', hint: 'Jazz Instrument' },
    { secret: 'Piano', hint: 'Keyboard' },
    { secret: 'Drums', hint: 'Percussion' },

    // Sports & Games
    { secret: 'Basketball', hint: 'Sport' },
    { secret: 'Chess', hint: 'Board Game' },
    { secret: 'Surfing', hint: 'Water Sport' },
    { secret: 'Bowling', hint: 'Indoor Sport' },
    { secret: 'Poker', hint: 'Card Game' },

    // Places & Travel
    { secret: 'Eiffel Tower', hint: 'Landmark' },
    { secret: 'Beach', hint: 'Vacation Spot' },
    { secret: 'Library', hint: 'Building' },
    { secret: 'Airport', hint: 'Travel' },
    { secret: 'Subway', hint: 'Transportation' },

    // Technology & Objects
    { secret: 'Smartphone', hint: 'Device' },
    { secret: 'Headphones', hint: 'Audio' },
    { secret: 'Umbrella', hint: 'Weather Accessory' },
    { secret: 'Backpack', hint: 'Bag' },
    { secret: 'Sunglasses', hint: 'Accessory' },

    // Entertainment
    { secret: 'Netflix', hint: 'Streaming' },
    { secret: 'Concert', hint: 'Live Event' },
    { secret: 'Rollercoaster', hint: 'Amusement Park' },
    { secret: 'Karaoke', hint: 'Singing' },

    // Nature & Weather
    { secret: 'Volcano', hint: 'Natural Disaster' },
    { secret: 'Rainbow', hint: 'Weather' },
    { secret: 'Waterfall', hint: 'Nature' },
    { secret: 'Cactus', hint: 'Plant' },

    // Professions & Roles
    { secret: 'Astronaut', hint: 'Space' },
    { secret: 'Chef', hint: 'Kitchen' },
    { secret: 'Detective', hint: 'Mystery' },
    { secret: 'Lifeguard', hint: 'Beach Job' },

    // Holidays & Events
    { secret: 'Halloween', hint: 'Holiday' },
    { secret: 'Wedding', hint: 'Celebration' },
    { secret: 'Birthday', hint: 'Party' },
    { secret: 'Graduation', hint: 'Ceremony' },
];

// Helper to get a random word pair, avoiding used indices
export function getRandomWordPair(usedIndices: number[]): { pair: typeof IMPOSTER_WORD_PAIRS[0]; index: number } {
    const availableIndices = IMPOSTER_WORD_PAIRS.map((_, i) => i).filter(i => !usedIndices.includes(i));

    // If all pairs have been used, reset (allow repeats)
    const indices = availableIndices.length > 0 ? availableIndices : IMPOSTER_WORD_PAIRS.map((_, i) => i);

    const randomIndex = indices[Math.floor(Math.random() * indices.length)];
    return {
        pair: IMPOSTER_WORD_PAIRS[randomIndex],
        index: randomIndex
    };
}
