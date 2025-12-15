import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';
import { processAction } from '@/lib/game-logic';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { roomId, playerId, type, payload } = body;

        const game = await gameStorage.getGame(roomId);
        if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

        // Validate player is in game
        if (!game.players[playerId]) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Special handling for END_PARTY - delete the game entirely
        if (type === 'END_PARTY') {
            // Only host can end the party
            if (game.hostId !== playerId) {
                return NextResponse.json({ error: 'Only the host can end the party' }, { status: 403 });
            }

            // Delete the game from storage
            await gameStorage.deleteGame(roomId);

            // Broadcast party-ended event to all clients
            try {
                await pusherServer.trigger(`room-${roomId}`, 'party-ended', { roomId });
            } catch (e) {
                console.error('Pusher trigger failed:', e);
            }

            return NextResponse.json({ success: true, ended: true });
        }

        let newState;
        try {
            newState = processAction(game, { playerId, type, payload });
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        if (newState !== game) {
            await gameStorage.saveGame(roomId, newState);
            try {
                await pusherServer.trigger(`room-${roomId}`, 'game-update', newState);
            } catch (e) {
                console.error('Pusher trigger failed:', e);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Game Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

