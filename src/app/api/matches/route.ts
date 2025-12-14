import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const matches = await gameStorage.getPublicMatches();

        // Sort by created recent
        const sorted = matches.sort((a, b) => b.createdAt - a.createdAt);

        // Sanitize (remove players logs etc, just summary)
        const summary = sorted.map(g => ({
            roomId: g.roomId,
            hostName: g.players[g.hostId]?.name || 'Unknown',
            spectators: Object.values(g.players).filter(p => p.role === 'spectator').length,
            createdAt: g.createdAt,
            status: g.matchStatus === 'playing' ? 'playing' : g.status, // Map matchStatus to status for UI if needed, or just use status
            mode: 'Party'
        }));

        return NextResponse.json(summary);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
