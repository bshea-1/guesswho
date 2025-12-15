import { GameState, ChatMessage } from './types';
import { CHARACTERS } from './characters';
import { sanitizeName } from './validation';

export function checkGuess(character: any, question: { category: string, value: any }): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!character) return false;
    return character[question.category] === question.value;
}

export type GameActionEnvelope = {
    playerId: string;
    type: 'ASK' | 'ANSWER' | 'GUESS' | 'END_TURN' | 'TOGGLE_READY' | 'TOGGLE_ELIMINATION' | 'FORFEIT' | 'UPDATE_NAME' | 'CHAT' | 'TOGGLE_QUEUE_PLAYER' | 'START_MATCH' | 'BAN_PLAYER' | 'END_PARTY';
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
        // Keep party chat, but clear game chat
        chat: state.chat.filter(m => m.scope !== 'game'),
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
                wins: 0,
            }
        },
        queue: [],
        bannedIds: [],
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
                    wins: 0,
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
                wins: 0,
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
            timestamp: Date.now(),
            scope: payload?.scope || 'party'
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

    // --- BAN PLAYER (HOST ONLY) ---
    if (type === 'BAN_PLAYER') {
        if (state.hostId !== playerId) throw new Error('Only host can ban players');

        const targetId = payload?.targetId;
        if (!targetId) return state;

        // Cannot ban yourself (the host)
        if (targetId === state.hostId) throw new Error('Cannot ban yourself');

        // Get the player's name before removing them (for ban tracking)
        const targetPlayer = state.players[targetId];
        if (!targetPlayer) return state;

        // Create a simple hash of the player name for ban persistence across reconnects
        const nameHash = `name:${targetPlayer.name.toLowerCase().trim()}`;

        // Remove from players
        const newPlayers = { ...state.players };
        delete newPlayers[targetId];

        // Remove from queue if present
        const newQueue = state.queue.filter(id => id !== targetId);

        // Add to banned list (both the ID and the name hash)
        const newBannedIds = [...(state.bannedIds || []), targetId, nameHash];

        return {
            ...state,
            players: newPlayers,
            queue: newQueue,
            bannedIds: newBannedIds,
        };
    }

    // --- HOST: START MATCH ---
    if (type === 'START_MATCH') {
        if (state.hostId !== playerId) throw new Error('Only host can start match');

        let p1Id = payload?.p1Id;
        let p2Id = payload?.p2Id;
        let currentQueue = [...state.queue];

        if (!p1Id || !p2Id) {
            // Auto Mode: Winner vs Queue
            const winnerId = state.winnerId;

            // 1. Identify Loser/Active Players and Rotate to Queue
            if (state.matchStatus === 'finished') {
                const activeIds = Object.values(state.players)
                    .filter(p => p.role === 'player' || (p.role === 'host' && p.characterId))
                    .map(p => p.id);

                if (winnerId) {
                    // Standard Case: Winner stays, Loser rotates
                    const loserId = activeIds.find(id => id !== winnerId);
                    if (loserId && !currentQueue.includes(loserId)) {
                        currentQueue.push(loserId);
                    }
                } else {
                    // Force End / No Winner Case: Everyone rotates to back of queue
                    // This ensures the queue is populated for valid selection below
                    activeIds.forEach(id => {
                        if (!currentQueue.includes(id)) {
                            currentQueue.push(id);
                        }
                    });
                }
            }

            // 2. Pick Players
            if (winnerId && state.players[winnerId]) {
                // Winner stays!
                p1Id = winnerId;

                // Challenger comes from front of queue
                if (currentQueue.length > 0) {
                    p2Id = currentQueue[0];
                } else {
                    // No one else? Loser just rotated in, so play them again?
                    // If queue was empty before loser rotated, currentQueue has [loserId]
                    // So P2 = loserId. Rematch!
                    if (currentQueue.length === 0) throw new Error('Not enough players');
                }
            } else {
                // First match or no winner recorded
                if (currentQueue.length >= 2) {
                    p1Id = currentQueue[0];
                    p2Id = currentQueue[1];
                } else if (currentQueue.length === 1 && state.hostId) {
                    p1Id = state.hostId;
                    p2Id = currentQueue[0];
                } else {
                    throw new Error('Not enough players in queue');
                }
            }
        }

        // Safety check
        if (!p1Id || !p2Id) throw new Error('Unable to determine players');

        // Pass the UPDATED queue (with loser added) to logic via state override?
        // startMatchLogic filters out p1/p2 from queue, but doesn't ADD the loser.
        // So we need to update state.queue first or pass it.
        const stateWithQueue = { ...state, queue: currentQueue };

        return startMatchLogic(stateWithQueue, p1Id, p2Id);
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

        // If HOST force-ended it (and Host wasn't playing, or explicitly chose strict end)
        // Actually, if playerId == hostId, we can say it's a "No Contest"
        const isHostAction = playerId === state.hostId;

        return {
            ...state,
            matchStatus: 'finished',
            winnerId: isHostAction ? null : (opponentId || null),
            players: (opponentId && !isHostAction) ? {
                ...state.players,
                [opponentId]: {
                    ...state.players[opponentId],
                    wins: (state.players[opponentId].wins || 0) + 1
                }
            } : state.players,
            history: [...state.history, {
                playerId: 'system',
                action: 'GAME_OVER',
                content: isHostAction
                    ? `Game ended by Host`
                    : `${state.players[playerId]?.name || 'Player'} forfeited the game`,
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
            .filter(p => p.characterId)
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
            .filter(p => p.role === 'player' || (p.role === 'host' && p.characterId))
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
                players: {
                    ...state.players,
                    [playerId]: {
                        ...state.players[playerId],
                        wins: (state.players[playerId].wins || 0) + 1
                    }
                },
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
                turnPlayerId: opponentId,
                history: [...state.history, {
                    playerId: 'system',
                    action: 'info',
                    content: `${state.players[playerId]?.name} guessed ${guessedChar.name} incorrectly. Turn passes to opponent.`,
                    timestamp: Date.now()
                }],
            };
        }
    }

    if (type === 'END_TURN') {
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player' || (p.role === 'host' && p.characterId))
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
