import { NextResponse } from 'next/server';
import { JoinRoomSchema, sanitizeName } from '@/lib/validation';
import { joinGame } from '@/lib/game-logic';
import { gameStorage } from '@/lib/storage';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = JoinRoomSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 });
        }

        const { roomId, playerName } = result.data;
        const cleanName = sanitizeName(playerName);

        const game = await gameStorage.getGame(roomId);
        if (!game) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const playerId = crypto.randomUUID();
        let newGame;
        try {
            newGame = joinGame(game, playerId, cleanName);
        } catch (e: any) {
            // If room full, return specific error
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        await gameStorage.saveGame(roomId, newGame);

        // Trigger Pusher update
        await pusherServer.trigger(`room-${roomId}`, 'game-update', newGame);

        return NextResponse.json({ roomId, playerId });
    } catch (error) {
        console.error('Join Room Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
