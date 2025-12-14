import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';
import { processAction } from '@/lib/game-logic';
import { pusherServer } from '@/lib/pusher';

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

        let newState;
        try {
            newState = processAction(game, { playerId, type, payload });
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        if (newState !== game) {
            await gameStorage.saveGame(roomId, newState);
            await pusherServer.trigger(`room-${roomId}`, 'game-update', newState);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Game Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
