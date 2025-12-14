import { GameState, ChatMessage } from './types';
import { CHARACTERS } from './characters';
import { sanitizeName } from './validation';

export function checkGuess(character: any, question: { category: string, value: any }): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!character) return false;
    return character[question.category] === question.value;
}

export type GameActionEnvelope = {
    playerId: string;
    type: 'ASK' | 'ANSWER' | 'GUESS' | 'END_TURN' | 'TOGGLE_READY' | 'TOGGLE_ELIMINATION' | 'FORFEIT' | 'UPDATE_NAME' | 'CHAT' | 'TOGGLE_QUEUE_PLAYER' | 'START_MATCH';
    payload?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// Replaced by unified joinGame
export function addSpectator(state: GameState): GameState {
    return state;
}

// Logic to start a match given two player IDs
function startMatchLogic(state: GameState, p1Id: string, p2Id: string): GameState {
    // Remove them from queue if there
    const newQueue = state.queue.filter(id => id !== p1Id && id !== p2Id);

    const resetPlayers = { ...state.players };

    // Reset everyone to spectator first (except host keeps host role visually via hostId check, but functionally is player/spectator)
    Object.keys(resetPlayers).forEach(pid => {
        const p = resetPlayers[pid];
        // Reset game state props
        resetPlayers[pid] = {
            ...p,
            role: 'spectator', // Reset to default spectator
            characterId: null,
            eliminatedIds: [],
            isReady: true // Auto-ready for match
        };
        if (pid === state.hostId) {
            // Host always has 'host' logic available via state.hostId, but role determines play
            // If we reset them to spectator here, we re-assign below if they are playing
        }
    });

    // Set active players
    resetPlayers[p1Id].role = 'player';
    resetPlayers[p2Id].role = 'player';

    // Assign Characters
    const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
    resetPlayers[p1Id].characterId = shuffled[0].id;
    resetPlayers[p2Id].characterId = shuffled[1].id;

    const turnPlayerId = Math.random() > 0.5 ? p1Id : p2Id;

    return {
        ...state,
        players: resetPlayers,
        queue: newQueue,
        status: 'playing', // Party status
        matchStatus: 'playing',
        turnPlayerId,
        winnerId: null,
        history: [{ playerId: 'system', action: 'join', content: 'Match Started', timestamp: Date.now() }],
    };
}

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
                // Host starts as Player 1
                role: 'player',
                characterId: null,
                eliminatedIds: [],
                isReady: false,
            }
        },
        queue: [],
        chat: [],
        status: 'lobby',
        matchStatus: 'lobby',
        turnPlayerId: null,
        winnerId: null,
        history: [],
        settings,
        createdAt: Date.now(),
    };
}

export function joinGame(state: GameState, playerId: string, playerName: string): GameState {
    if (state.players[playerId]) return state; // Already joined

    // Check how many players currently exist (to decide role)
    const playerCount = Object.keys(state.players).length;

    // If only 1 player (Host), this new person is Player 2
    // And we should AUTO-START the match
    if (playerCount === 1) {
        // Add as Player 2
        const stateWithP2: GameState = {
            ...state,
            players: {
                ...state.players,
                [playerId]: {
                    id: playerId,
                    name: playerName,
                    role: 'player',
                    characterId: null,
                    eliminatedIds: [],
                    isReady: true,
                }
            }
        };
        // Auto-start using Host and New Player
        return startMatchLogic(stateWithP2, state.hostId, playerId);
    }

    // Otherwise join as spectator
    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                id: playerId,
                name: playerName,
                role: 'spectator',
                characterId: null,
                eliminatedIds: [],
                isReady: false,
            }
        }
    };
}

export function processAction(state: GameState, action: GameActionEnvelope): GameState {
    const { playerId, type, payload } = action;

    // --- CHAT ---
    if (type === 'CHAT') {
        const text = payload?.text;
        if (!text || !text.trim()) return state;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            playerId,
            text: text.trim(),
            timestamp: Date.now()
        };

        // Keep last 50 messages
        const newChat = [...state.chat, newMessage].slice(-50);
        return { ...state, chat: newChat };
    }

    // --- QUEUE MANAGEMENT (HOST ONLY) ---
    if (type === 'TOGGLE_QUEUE_PLAYER') {
        if (state.hostId !== playerId) throw new Error('Only host can manage queue');

        const targetId = payload?.targetId;
        if (!targetId || !state.players[targetId]) return state;

        const isInQueue = state.queue.includes(targetId);

        // Cannot queue active players? Or maybe you can toggle them to be queued for NEXT match?
        // Let's allow queuing anyone except maybe the host if they are managing?
        // For simplicity: Toggle in/out

        if (isInQueue) {
            return { ...state, queue: state.queue.filter(id => id !== targetId) };
        } else {
            // Append to queue
            return { ...state, queue: [...state.queue, targetId] };
        }
    }

    // --- HOST: START MATCH ---
    if (type === 'START_MATCH') {
        if (state.hostId !== playerId) throw new Error('Only host can start match');

        // Payload should be { p1Id, p2Id } or fallback to top 2 in queue
        let p1Id = payload?.p1Id;
        let p2Id = payload?.p2Id;

        if (!p1Id || !p2Id) {
            // Host Logic:
            // 1. If HOST is not in queue AND there's only 1 person in queue, Host plays against them?
            // 2. If 2 people in queue, they play.
            // 3. User Requirement: "Host can be a spectator in later matches"
            // "Host can choose to leave match and become spectator" (handled by game over / reset)

            // Simplest auto-selection:
            // Take top 2 from Queue.
            // If only 1 in queue, and Host is NOT that person (obviously), Host plays vs Queue[0].
            // If 0 in queue -> Error? Or Host vs AI? (No AI). 

            // Let's implement:
            // If >= 2 in queue, take top 2.
            // If 1 in queue, and Host is NOT that person (obviously), Host plays vs Queue[0].

            if (state.queue.length >= 2) {
                p1Id = state.queue[0];
                p2Id = state.queue[1];
            } else if (state.queue.length === 1) {
                p1Id = state.hostId;
                p2Id = state.queue[0];
            } else {
                throw new Error('Not enough players (needs 2 in queue or Host + 1)');
            }
        }

        return startMatchLogic(state, p1Id, p2Id);
    }


    // --- GAMEPLAY ACTIONS ---

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

    // Handle FORFEIT anytime
    if (type === 'FORFEIT') {
        if (state.matchStatus !== 'playing') return state;

        // Find opponent (the other player)
        // const opponentId = Object.keys(state.players).find(id => id !== playerId); 
        // ^ This logic was for 2-player rooms. Now we have many.

        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player' || (p.role === 'host' && p.characterId)) // Host might be playing
            .map(p => p.id);

        // Better way: Find the other active player
        const opponentId = activeIds.find(id => id !== playerId);

        return {
            ...state,
            matchStatus: 'finished',
            winnerId: opponentId || null,
            history: [...state.history, {
                playerId: 'system',
                action: 'GAME_OVER',
                content: `${state.players[playerId]?.name || 'Player'} forfeited the game`,
                timestamp: Date.now()
            }],
        };
    }


    if (type === 'UPDATE_NAME') {
        const newName = payload;
        if (!newName || typeof newName !== 'string') throw new Error('Invalid name');

        return {
            ...state,
            players: {
                ...state.players,
                [playerId]: { ...state.players[playerId], name: sanitizeName(newName) }
            }
        };
    }




    // Strict Gameplay check
    if (state.matchStatus !== 'playing') {
        if (type === 'ASK' || type === 'GUESS' || type === 'ANSWER') {
            throw new Error('Game not playing');
        }
    }


    if (type === 'ASK') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        // Switch turn to opponent after asking
        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player')
            .map(p => p.id);
        const opponentId = activeIds.find(id => id !== playerId);

        return {
            ...state,
            turnPlayerId: opponentId || null, // Switch to opponent for answer
            history: [...state.history, { playerId, action: 'ask', content: payload, timestamp: Date.now() }],
        };
    }

    if (type === 'ANSWER') {
        // After answering, the answerer (current player) gets to ask a question next
        return {
            ...state,
            turnPlayerId: playerId, // Keep turn with the answerer so they can ask
            history: [...state.history, { playerId, action: 'answer', content: payload, timestamp: Date.now() }],
        };
    }

    if (type === 'GUESS') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');
        const guessInput = payload;

        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player')
            .map(p => p.id);
        const opponentId = activeIds.find(id => id !== playerId);

        if (!opponentId) throw new Error('No opponent');
        const opponent = state.players[opponentId];

        // Map name to ID (case-insensitive)
        const guessedChar = CHARACTERS.find(c =>
            c.id.toLowerCase() === guessInput.toLowerCase() ||
            c.name.toLowerCase() === guessInput.toLowerCase()
        );

        if (!guessedChar) {
            throw new Error(`Character "${guessInput}" not found`);
        }

        const isCorrect = opponent.characterId === guessedChar.id;
        const opponentCharName = CHARACTERS.find(c => c.id === opponent.characterId)?.name || 'Unknown';

        if (isCorrect) {
            return {
                ...state,
                matchStatus: 'finished',
                winnerId: playerId,
                history: [...state.history, {
                    playerId: 'system',
                    action: 'WIN',
                    content: `${state.players[playerId]?.name} correctly guessed ${guessedChar.name} !`,
                    timestamp: Date.now()
                }],
            };
        } else {
            return {
                ...state,
                matchStatus: 'finished',
                winnerId: opponentId,
                history: [...state.history, {
                    playerId: 'system',
                    action: 'GAME_OVER',
                    content: `${state.players[playerId]?.name} guessed ${guessedChar.name} incorrectly. It was ${opponentCharName} !`,
                    timestamp: Date.now()
                }],
            };
        }
    }

    if (type === 'END_TURN') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player')
            .map(p => p.id);
        const opponentId = activeIds.find(id => id !== playerId);

        return {
            ...state,
            turnPlayerId: opponentId || null,
        };
    }

    return state;
}

// Deprecated or simplified
export function startGame(state: GameState): GameState {
    return state;
}
