import { z } from 'zod';

const BAD_WORDS = ['admin', 'mod', 'system', 'fuck', 'shit', 'bitch', 'ass']; // Basic list, expand as needed

export const NameSchema = z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(16, 'Name must be at most 16 characters')
    .trim()
    .refine(val => /^[a-zA-Z0-9 _-]+$/.test(val), 'Name contains invalid characters')
    .refine(val => !BAD_WORDS.some(word => val.toLowerCase().includes(word)), 'Name contains inappropriate words');

export function sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
}

export const CreateRoomSchema = z.object({
    hostName: NameSchema.optional(),
    visibility: z.enum(['public', 'unlisted', 'private']),
    gameType: z.enum(['guess-who', 'word-bomb', 'connect-4', 'cah', 'dots-and-boxes', 'imposter']).default('guess-who'),
    imposterMode: z.enum(['text', 'irl']).optional(),
    cahWinThreshold: z.number().min(3).max(10).optional(),
});

export const JoinRoomSchema = z.object({
    roomId: z.string().min(1),
    playerName: NameSchema.optional(),
    isSpectator: z.boolean().optional(),
});
