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
            spectators: g.spectators,
            createdAt: g.createdAt,
            status: g.status,
            mode: g.settings.mode
        }));

        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}
