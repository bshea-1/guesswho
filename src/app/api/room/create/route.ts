import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { CreateRoomSchema, sanitizeName } from '@/lib/validation';
import { createInitialGameState } from '@/lib/game-logic';
import { gameStorage } from '@/lib/storage';

// Short ID generator (4 chars, ambiguous removed)
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 4);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = CreateRoomSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 }); // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const { hostName, visibility, gameType, imposterMode, cahWinThreshold } = result.data;
        // Default name if empty string provided
        const cleanName = sanitizeName(hostName || 'Host');

        // Generate Room ID
        let roomId = nanoid();
        let attempts = 0;
        while ((await gameStorage.getGame(roomId)) && attempts < 5) {
            roomId = nanoid();
            attempts++;
        }

        if (attempts >= 5) {
            return NextResponse.json({ error: 'Failed to generate room ID' }, { status: 500 });
        }

        // Host ID is a secret session ID for the user
        const hostId = crypto.randomUUID();

        const initialGame = createInitialGameState(roomId, cleanName, hostId, gameType, {
            visibility,
            spectatorView: 'log', // Default
            cahWinThreshold: cahWinThreshold || 5,
        }, imposterMode);

        await gameStorage.saveGame(roomId, initialGame);

        return NextResponse.json({ roomId, playerId: hostId });
    } catch (error) {
        console.error('Create Room Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
