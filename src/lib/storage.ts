import { kv } from '@vercel/kv';
import { GameState } from './types';

const IS_KV_CONFIGURED = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// In-memory fallback for local development without KV
const localStore = new Map<string, string>();

export const gameStorage = {
    async getGame(roomId: string): Promise<GameState | null> {
        if (IS_KV_CONFIGURED) {
            return await kv.get<GameState>(`game:${roomId}`);
        }
        const data = localStore.get(`game:${roomId}`);
        return data ? JSON.parse(data) : null;
    },

    async saveGame(roomId: string, state: GameState): Promise<void> {
        if (IS_KV_CONFIGURED) {
            await kv.set(`game:${roomId}`, state, { ex: 86400 });
            if (state.settings.visibility === 'public' && state.status !== 'finished') {
                await kv.sadd('public_matches', roomId);
            } else if (state.status === 'finished') {
                await kv.srem('public_matches', roomId);
                // Optional: Move to 'recent_matches' list?
                await kv.lpush('recent_matches', JSON.stringify({ roomId, winnerId: state.winnerId, timestamp: Date.now() }));
                await kv.ltrim('recent_matches', 0, 49); // Keep last 50
            }
        } else {
            localStore.set(`game:${roomId}`, JSON.stringify(state));
            // Local mock for set?
        }
    },

    async getPublicMatches(): Promise<GameState[]> {
        if (IS_KV_CONFIGURED) {
            const ids = await kv.smembers('public_matches');
            if (!ids.length) return [];

            // Batch fetch
            // kv.mget is ideal but requires keys.
            const keys = ids.map(id => `game:${id}`);
            if (keys.length === 0) return [];

            const games = await kv.mget<GameState[]>(...keys);
            return games.filter(g => g !== null) as GameState[];
        } else {
            // Local filter
            return Array.from(localStore.values())
                .map(s => JSON.parse(s) as GameState)
                .filter(g => g.settings.visibility === 'public' && g.status !== 'finished');
        }
    },

    async deleteGame(roomId: string): Promise<void> {
        if (IS_KV_CONFIGURED) {
            await kv.del(`game:${roomId}`);
        } else {
            localStore.delete(`game:${roomId}`);
        }
    }
};
