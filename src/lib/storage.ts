import { GameState } from './types';
import { supabase } from './supabase';
import fs from 'fs/promises';
import path from 'path';

const IS_SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_LOCAL = process.env.NODE_ENV === 'development';
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'games.json');

// Cleanup thresholds
// Cleanup thresholds
const FINISHED_GAME_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const INACTIVE_GAME_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

// In-memory fallback for production without Supabase
// NOTE: This will NOT persist across serverless function cold starts!
// This is only a temporary fallback - Supabase should be configured for production
const memoryStore = new Map<string, GameState>();

// Ensure data directory exists (local only)
const ensureDataDir = async () => {
    if (!IS_LOCAL) return;
    try {
        await fs.access(LOCAL_DATA_DIR);
    } catch {
        await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    }
};

// Helper to read local file
const readLocalData = async (): Promise<Record<string, GameState>> => {
    if (!IS_LOCAL) {
        // Convert memoryStore Map to object for production fallback
        const obj: Record<string, GameState> = {};
        memoryStore.forEach((v, k) => obj[k] = v);
        return obj;
    }
    try {
        await ensureDataDir();
        const data = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
};

// Helper to write local file
const writeLocalData = async (data: Record<string, GameState>) => {
    if (!IS_LOCAL) {
        // Update memoryStore for production fallback
        memoryStore.clear();
        Object.entries(data).forEach(([k, v]) => memoryStore.set(k, v));
        return;
    }
    await ensureDataDir();
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
};

export const gameStorage = {
    async getGame(roomId: string): Promise<GameState | null> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('games')
                .select('state')
                .eq('room_id', roomId)
                .single();

            if (error || !data) return null;
            return data.state as GameState;
        }
        const games = await readLocalData();
        return games[roomId] || null;
    },

    async saveGame(roomId: string, state: GameState): Promise<void> {
        // Update lastActivity timestamp
        const stateWithActivity = { ...state, lastActivity: Date.now() };

        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('games')
                .upsert({
                    room_id: roomId,
                    state: stateWithActivity,
                    visibility: state.settings.visibility,
                    status: state.status,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                console.error('Supabase save error:', error);
                throw new Error('Failed to save game state');
            }

            // Run cleanup in background (don't await)
            this.cleanupOldGames().catch(console.error);
        } else {
            const games = await readLocalData();
            games[roomId] = stateWithActivity;
            await writeLocalData(games);

            // Cleanup old local games
            await this.cleanupOldGames();
        }
    },

    async getPublicMatches(): Promise<GameState[]> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('games')
                .select('state')
                .eq('visibility', 'public')
                .neq('status', 'finished')
                .neq('status', 'lobby')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error || !data) return [];
            return data.map(row => row.state as GameState);
        } else {
            const games = await readLocalData();
            return Object.values(games)
                .filter(g => g.settings.visibility === 'public' && g.status !== 'finished' && g.status !== 'lobby');
        }
    },

    async deleteGame(roomId: string): Promise<void> {
        if (IS_SUPABASE_CONFIGURED) {
            await supabase
                .from('games')
                .delete()
                .eq('room_id', roomId);
        } else {
            const games = await readLocalData();
            delete games[roomId];
            await writeLocalData(games);
        }
    },

    async cleanupOldGames(): Promise<void> {
        const now = Date.now();

        if (IS_SUPABASE_CONFIGURED) {
            // Delete finished games older than 5 minutes
            const finishedCutoff = new Date(now - FINISHED_GAME_EXPIRY_MS).toISOString();
            await supabase
                .from('games')
                .delete()
                .eq('status', 'finished')
                .lt('updated_at', finishedCutoff);

            // Delete inactive games older than 30 minutes
            const inactiveCutoff = new Date(now - INACTIVE_GAME_EXPIRY_MS).toISOString();
            await supabase
                .from('games')
                .delete()
                .lt('updated_at', inactiveCutoff);
        } else {
            const games = await readLocalData();
            let changed = false;

            for (const [roomId, game] of Object.entries(games)) {
                const lastActivity = (game as any).lastActivity || game.createdAt; // eslint-disable-line @typescript-eslint/no-explicit-any
                const age = now - lastActivity;

                // Delete finished games after 5 minutes
                if (game.status === 'finished' && age > FINISHED_GAME_EXPIRY_MS) {
                    delete games[roomId];
                    changed = true;
                }
                // Delete inactive games after 30 minutes
                else if (age > INACTIVE_GAME_EXPIRY_MS) {
                    delete games[roomId];
                    changed = true;
                }
            }

            if (changed) {
                await writeLocalData(games);
            }
        }
    }
};
