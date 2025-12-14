import { GameState, Player, Character, Turn } from './types';
import { CHARACTERS } from './characters';

export function createInitialGameState(
    roomId: string,
    hostName: string,
    hostId: string,
    settings: GameState['settings']
): GameState {
    return {
        roomId,
        hostId,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                role: 'host',
                characterId: null,
                eliminatedIds: [],
                isReady: false,
            }
        },
        spectators: 0,
        status: 'lobby',
        turnPlayerId: null,
        winnerId: null,
        history: [],
        settings,
        createdAt: Date.now(),
    };
}

export function joinGame(state: GameState, playerId: string, playerName: string): GameState {
    if (state.players[playerId]) return state; // Already joined

    const playerIds = Object.keys(state.players);
    if (playerIds.length >= 2) {
        // Join as spectator? Logic handled in route usually, but here we assume strictly adding to players
        throw new Error('Room is full');
    }

    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                id: playerId,
                name: playerName,
                role: 'player',
                characterId: null,
                eliminatedIds: [],
                isReady: false,
            }
        }
    };
}

export type GameActionEnvelope = {
    playerId: string;
    type: 'ASK' | 'ANSWER' | 'GUESS' | 'END_TURN' | 'TOGGLE_READY' | 'TOGGLE_ELIMINATION';
    payload?: any;
};

export function processAction(state: GameState, action: GameActionEnvelope): GameState {
    const { playerId, type, payload } = action;

    // Allow toggling eliminations anytime during play
    if (type === 'TOGGLE_ELIMINATION') {
        const player = state.players[playerId];
        const targetId = payload;

        const isEliminated = player.eliminatedIds.includes(targetId);
        const newEliminated = isEliminated
            ? player.eliminatedIds.filter(id => id !== targetId)
            : [...player.eliminatedIds, targetId];

        return {
            ...state,
            players: {
                ...state.players,
                [playerId]: { ...player, eliminatedIds: newEliminated }
            }
        };
    }

    if (state.status !== 'playing' && type !== 'TOGGLE_READY') {
        throw new Error('Game not playing');
    }

    // Handle Ready Toggle in Lobby
    if (state.status === 'lobby' || state.status === 'selecting') {
        if (type === 'TOGGLE_READY') {
            const player = state.players[playerId];
            if (!player) throw new Error('Player not found');

            const newPlayers = {
                ...state.players,
                [playerId]: { ...player, isReady: !player.isReady }
            };

            // Check if both ready to start
            const allReady = Object.values(newPlayers).length === 2 && Object.values(newPlayers).every(p => p.isReady);

            if (allReady) {
                return startGame({ ...state, players: newPlayers });
            }

            return { ...state, players: newPlayers };
        }
        return state;
    }

    if (type === 'ASK') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        return {
            ...state,
            history: [...state.history, { playerId, action: 'ask', content: payload, timestamp: Date.now() }],
        };
    }

    if (type === 'ANSWER') {
        return {
            ...state,
            history: [...state.history, { playerId, action: 'answer', content: payload, timestamp: Date.now() }],
        };
    }

    if (type === 'GUESS') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');
        const targetId = payload;

        const opponentId = Object.keys(state.players).find(id => id !== playerId);
        if (!opponentId) throw new Error('No opponent');
        const opponent = state.players[opponentId];

        const isCorrect = opponent.characterId === targetId;

        if (isCorrect) {
            return {
                ...state,
                status: 'finished',
                winnerId: playerId,
                history: [...state.history, { playerId, action: 'guess', content: `Guessed ${targetId} CORRECTLY!`, timestamp: Date.now() }],
            };
        } else {
            return {
                ...state,
                status: 'finished',
                winnerId: opponentId, // Opponent wins
                history: [...state.history, { playerId, action: 'guess', content: `Guessed ${targetId} INCORRECTLY!`, timestamp: Date.now() }],
            };
        }
    }

    if (type === 'END_TURN') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        const opponentId = Object.keys(state.players).find(id => id !== playerId);
        return {
            ...state,
            turnPlayerId: opponentId || null,
            history: [...state.history, { playerId, action: 'ask', content: 'Ends Turn', timestamp: Date.now() }],
        };
    }

    return state;
}

export function startGame(state: GameState): GameState {
    const playerIds = Object.keys(state.players);
    if (playerIds.length < 2) throw new Error('Need 2 players to start');

    // Assign random characters
    const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
    const p1Id = playerIds[0];
    const p2Id = playerIds[1];

    const p1Char = shuffled[0];
    const p2Char = shuffled[1];

    // Randomize turn
    const turnPlayerId = Math.random() > 0.5 ? p1Id : p2Id;

    return {
        ...state,
        status: 'playing',
        turnPlayerId,
        history: [...state.history, { playerId: 'system', action: 'guess', content: 'Game Started', timestamp: Date.now() }],
        players: {
            ...state.players,
            [p1Id]: { ...state.players[p1Id], characterId: p1Char.id, isReady: true },
            [p2Id]: { ...state.players[p2Id], characterId: p2Char.id, isReady: true },
        }
    };
}
