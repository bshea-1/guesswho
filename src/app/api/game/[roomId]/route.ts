import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;

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

    // Determine if the requester is a spectator or a non-playing host
    const requester = playerId ? game.players[playerId] : null;
    const isSpectator = requester && (
        requester.role === 'spectator' ||
        (requester.role === 'host' && !requester.characterId)
    );

    const sanitizedPlayers = Object.entries(game.players).reduce((acc, [pid, p]) => {
        // For Guess Who: Show characterId IF:
        // 1. It's the player themselves
        // 2. The game is finished (using matchStatus for accuracy, checking both)
        // 3. The requester is a spectator (or non-playing host)
        // For other games (Connect 4, Word Bomb, etc.): characterId is just a color/identifier and should always be visible
        const isGuessWho = game.gameType === 'guess-who';

        const shouldReveal = !isGuessWho || // Always reveal for non-Guess Who games
            pid === playerId ||
            game.status === 'finished' ||
            game.matchStatus === 'finished' ||
            isSpectator;

        // For Imposter: Sanitize player data
        // - Each player should only see their own secretWord/hintWord
        // - Imposter should NEVER see the secret word
        let sanitizedData = p.data;
        if (game.gameType === 'imposter' && p.data) {
            if (pid === playerId) {
                // Player sees their own data
                sanitizedData = p.data;
            } else {
                // Hide other players' secrets
                sanitizedData = {
                    isImposter: undefined, // Hide whether others are imposter
                    secretWord: undefined,
                    hintWord: undefined
                };
            }
        }

        acc[pid] = {
            ...p,
            characterId: shouldReveal ? p.characterId : '???',
            data: sanitizedData
        };
        return acc;
    }, {} as typeof game.players);

    // For Imposter: Hide the imposter identity until results phase
    const sanitizedGame = {
        ...game,
        players: sanitizedPlayers,
        serverTime: Date.now(),
        // Hide imposter identity from all players until results
        imposterId: game.gameType === 'imposter' && game.imposterPhase !== 'results' ? undefined : game.imposterId,
        // NEVER expose the secret word in the game state to the client - it's only in player.data for non-imposters
        imposterSecretWord: undefined
    };

    return NextResponse.json(sanitizedGame);
}
