import { NextResponse } from 'next/server';
import { gameStorage } from '@/lib/storage';
import { processAction } from '@/lib/game-logic';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { roomId, playerId, type, payload } = body;

        // FAST PATH: For UPDATE_TYPING, broadcast immediately without DB read
        // This provides near-instant real-time typing visibility
        if (type === 'UPDATE_TYPING') {
            try {
                // Robustly extract text
                const text = payload?.text || (typeof payload === 'string' ? payload : '') || '';

                // console.log(`[API] Broadcasting typing update for room ${roomId} player ${playerId}: "${text}"`);

                await pusherServer.trigger(`room-${roomId}`, 'typing-update', {
                    playerId,
                    text: String(text)
                });
            } catch (e) {
                console.error('Pusher trigger failed:', e);
            }
            return NextResponse.json({ success: true });
        }

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

        // SERVER-SIDE DICTIONARY VALIDATION for Word Bomb
        if (type === 'SUBMIT_WORD' && game.gameType === 'word-bomb') {
            const word = (payload?.word || '').toLowerCase().trim();

            // Length validation
            if (word.length < 2) {
                return NextResponse.json({ error: 'Word too short' }, { status: 400 });
            }

            // 2-Letter word validation (static allowlist)
            if (word.length === 2) {
                const VALID_TWO_LETTER_WORDS = new Set([
                    'aa', 'ab', 'ad', 'ae', 'ag', 'ah', 'ai', 'al', 'am', 'an', 'ar', 'as', 'at', 'aw', 'ax', 'ay',
                    'ba', 'be', 'bi', 'bo', 'by', 'de', 'do', 'ed', 'ef', 'eh', 'el', 'em', 'en', 'er', 'es', 'et', 'ex',
                    'fa', 'fe', 'go', 'ha', 'he', 'hi', 'ho', 'id', 'if', 'in', 'is', 'it', 'jo', 'ka', 'ki',
                    'la', 'li', 'lo', 'ma', 'me', 'mi', 'mm', 'mo', 'mu', 'my', 'na', 'ne', 'no', 'nu',
                    'od', 'oe', 'of', 'oh', 'oi', 'ok', 'om', 'on', 'op', 'or', 'os', 'ow', 'ox', 'oy',
                    'pa', 'pe', 'pi', 'po', 'qi', 're', 'sh', 'si', 'so', 'ta', 'te', 'ti', 'to',
                    'uh', 'um', 'un', 'up', 'us', 'ut', 'we', 'wo', 'xi', 'xu', 'ya', 'ye', 'yo', 'za'
                ]);
                if (!VALID_TWO_LETTER_WORDS.has(word)) {
                    return NextResponse.json({ error: 'Invalid 2-letter word' }, { status: 400 });
                }
            }

            // 3+ Letter word validation (Dictionary API only)
            if (word.length >= 3) {
                // Common words that APIs might miss
                const COMMON_WORDS = new Set([
                    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
                    'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may',
                    'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'got', 'him',
                    'let', 'put', 'say', 'she', 'too', 'use', 'dad', 'mom', 'yes', 'yet',
                    'thing', 'think', 'things', 'other', 'there', 'their', 'which', 'about',
                    'would', 'these', 'could', 'being', 'after', 'before', 'through', 'where'
                ]);

                if (!COMMON_WORDS.has(word)) {
                    let isValid = false;

                    try {
                        // Use Dictionary API only
                        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
                        isValid = dictRes.ok;
                    } catch (dictError) {
                        console.error('Dictionary API check failed:', dictError);
                    }

                    // FAIL CLOSED: If word is not validated, reject it
                    if (!isValid) {
                        return NextResponse.json({ error: 'Not a valid dictionary word' }, { status: 400 });
                    }
                }
            }
        }

        let newState;
        try {
            newState = processAction(game, { playerId, type, payload });
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        if (newState !== game) {
            // Optimization: For high-frequency UPDATE_TYPING, skip DB persistence
            // This massively reduces latency for real-time typing displays
            if (type === 'UPDATE_TYPING') {
                try {
                    await pusherServer.trigger(`room-${roomId}`, 'game-update', newState);
                } catch (e) {
                    console.error('Pusher trigger failed:', e);
                }
            } else {
                // For all other actions, persist to DB deeply
                await gameStorage.saveGame(roomId, newState);
                try {
                    await pusherServer.trigger(`room-${roomId}`, 'game-update', newState);
                } catch (e) {
                    console.error('Pusher trigger failed:', e);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Game Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

