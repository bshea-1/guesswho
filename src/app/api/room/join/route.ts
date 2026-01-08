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
            return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 }); // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const { roomId, playerName, isSpectator } = result.data;
        const cleanName = sanitizeName(playerName || (isSpectator ? 'Spectator' : 'Player 2'));

        const game = await gameStorage.getGame(roomId);
        if (!game) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Check if this player name is banned
        const nameHash = `name:${cleanName.toLowerCase().trim()}`;
        if (game.bannedIds?.includes(nameHash)) {
            return NextResponse.json({ error: 'You have been banned from this room' }, { status: 403 });
        }

        const playerId = crypto.randomUUID();
        let newGame;
        try {
            if (isSpectator) {
                // If spectator, just increment count, do NOT add to players
                // We typically verify if we can add a spectator (usually unlimited, but good to have a path)
                // Use a different helper if we were tracking spectator IDs, but for now we just increment count
                // AND we do NOT add them to the players list.
                // However, we must return a playerId so the client works (even if this ID isn't in game.players)

                // We should import addSpectator
                const { addSpectator } = await import('@/lib/game-logic');
                newGame = addSpectator(game);
            } else {
                newGame = joinGame(game, playerId, cleanName);
            }
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // If room full, return specific error
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        await gameStorage.saveGame(roomId, newGame);

        // Trigger Pusher update (non-blocking - don't fail join if Pusher has issues)
        try {
            await pusherServer.trigger(`room-${roomId}`, 'game-update', newGame);
        } catch (pusherError) {
            console.error('Pusher trigger failed:', pusherError);
            // Don't fail the join - client can poll for updates
        }

        return NextResponse.json({ roomId, playerId });
    } catch (error) {
        console.error('Join Room Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
