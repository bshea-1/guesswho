// Word Bomb Game Constants and Types

const PROMPTS_2 = [
    'TH', 'CH', 'SH', 'PH', 'WH', 'CK', 'NG', 'QU',
    'EI', 'IE', 'EA', 'OU', 'AI', 'OO', 'EE',
    'TR', 'PR', 'CR', 'BR', 'GR', 'FR', 'DR',
    'ST', 'SP', 'SC', 'SK', 'SL', 'SM', 'SN', 'SW'
];

const PROMPTS_3 = [
    'ING', 'TIO', 'THE', 'AND', 'ENT', 'ION', 'TER',
    'FOR', 'WAS', 'NCE', 'EDT', 'TIS', 'OFT', 'STH',
    'MEN', 'ALL', 'HER', 'ITH', 'HIS', 'OUR', 'ERE',
    'PRO', 'COM', 'PER', 'INT', 'EST', 'STA', 'CTI',
    'OTH', 'ERS', 'ITY', 'RAT', 'VER', 'ATE', 'OUN',
    'ARE', 'EVE', 'OUT', 'ITE', 'INE', 'ANI', 'INI'
];

export const WORD_BOMB_PROMPTS = [...PROMPTS_2, ...PROMPTS_3]; // Export for backward compat if needed

export interface WordBombPlayerData {
    lives: number;
    isEliminated: boolean;
    usedLetters: string[];
    hasReceivedGoldenHeart?: boolean;
}

export const INITIAL_LIVES = 2;
export const INITIAL_TIMER_SECONDS = 20;
export const MIN_TIMER_SECONDS = 7;
export const TIMER_DECREASE_PER_ROUND = 0.5; // Deprecated, using step logic

export function getRandomPrompt(): string {
    // 50% chance for 2-letter, 50% chance for 3-letter
    const useTwoLetter = Math.random() < 0.5;
    const pool = useTwoLetter ? PROMPTS_2 : PROMPTS_3;
    return pool[Math.floor(Math.random() * pool.length)];
}

export function createInitialWordBombData(): WordBombPlayerData {
    return {
        lives: INITIAL_LIVES,
        isEliminated: false,
        usedLetters: []
    };
}
