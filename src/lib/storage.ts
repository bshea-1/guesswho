import { GameState } from './types';
import { supabase } from './supabase';
import fs from 'fs/promises';
import path from 'path';

const IS_SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'games.json');

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(LOCAL_DATA_DIR);
    } catch {
        await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    }
};

// Helper to read local file
const readLocalData = async (): Promise<Record<string, GameState>> => {
    if (IS_SUPABASE_CONFIGURED) return {};
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
    if (IS_SUPABASE_CONFIGURED) return;
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
        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('games')
                .upsert({
                    room_id: roomId,
                    state: state,
                    visibility: state.settings.visibility,
                    status: state.status,
                });

            if (error) {
                console.error('Supabase save error:', error);
                throw new Error('Failed to save game state');
            }
        } else {
            const games = await readLocalData();
            games[roomId] = state;
            await writeLocalData(games);
        }
    },

    async getPublicMatches(): Promise<GameState[]> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('games')
                .select('state')
                .eq('visibility', 'public')
                .neq('status', 'finished')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error || !data) return [];
            return data.map(row => row.state as GameState);
        } else {
            const games = await readLocalData();
            return Object.values(games)
                .filter(g => g.settings.visibility === 'public' && g.status !== 'finished');
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
    }
};
