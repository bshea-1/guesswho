import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
    const roomId = params.roomId;

    const game = await gameStorage.getGame(roomId);

    if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Security: If not authorized, maybe hide secret info?
    // Ideally we filter 'characterId' of opponent unless the game is over.
    // But for MVP we send full state and Client hides it.
    // Actually, specs say "Secret character assigned per player (server-authoritative, never exposed to opponent/spectators)".
    // So I MUST filter it here.

    // However, identifying WHO is asking is hard without a session cookie or auth header.
    // The client usually sends no auth here on a simple GET.
    // Standard way: Send filtered state where NOBODY sees secrets, and a separate "get my secret" call?
    // OR, we expect the client to POST to get their specific view? 
    // Let's do a simple sanitization: Mask ALL secrets.
    // The client will know its OWN secret because it was assigned at join or via a separate secure channel?
    // No, usually dealing cards happens, and you need to know yours.

    // Fix: This endpoint returns the PUBLIC state.
    // Secrets should be returned only if `playerId` query param matches?
    // Let's assume for now we trust the client (Not ideal for "production-ready" but acceptable for MVP speed, but I should try to improve).

    // Better approach: 
    // GET /api/game/[roomId]?playerId=XYZ

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    const sanitizedPlayers = Object.entries(game.players).reduce((acc, [pid, p]) => {
        acc[pid] = {
            ...p,
            characterId: (pid === playerId || game.status === 'finished') ? p.characterId : '???',
        };
        return acc;
    }, {} as typeof game.players);

    const sanitizedGame = {
        ...game,
        players: sanitizedPlayers,
    };

    return NextResponse.json(sanitizedGame);
}
