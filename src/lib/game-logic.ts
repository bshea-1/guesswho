import { GameState, Player, Character, Turn, ChatMessage } from './types';
import { CHARACTERS } from './characters';
import { sanitizeName } from './validation';

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

    // Everyone joins as spectator initially, unless it's the host (handled in create)
    // Host can promote them later
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

export type GameActionEnvelope = {
    playerId: string;
    type: 'ASK' | 'ANSWER' | 'GUESS' | 'END_TURN' | 'TOGGLE_READY' | 'TOGGLE_ELIMINATION' | 'FORFEIT' | 'UPDATE_NAME' | 'CHAT' | 'JOIN_QUEUE' | 'LEAVE_QUEUE' | 'START_MATCH';
    payload?: any;
};

// Replaced by unified joinGame
export function addSpectator(state: GameState): GameState {
    return state;
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

    // --- QUEUE ---
    if (type === 'JOIN_QUEUE') {
        if (state.queue.includes(playerId)) return state;
        return {
            ...state,
            queue: [...state.queue, playerId]
        };
    }

    if (type === 'LEAVE_QUEUE') {
        return {
            ...state,
            queue: state.queue.filter(id => id !== playerId)
        };
    }

    // --- HOST: START MATCH ---
    if (type === 'START_MATCH') {
        if (state.hostId !== playerId) throw new Error('Only host can start match');

        // Payload should be { p1Id, p2Id } or fallback to top 2 in queue
        let p1Id = payload?.p1Id;
        let p2Id = payload?.p2Id;

        if (!p1Id || !p2Id) {
            // Try taking from queue
            if (state.queue.length >= 2) {
                p1Id = state.queue[0];
                p2Id = state.queue[1];
            } else {
                throw new Error('Not enough players in queue');
            }
        }

        // Remove them from queue
        const newQueue = state.queue.filter(id => id !== p1Id && id !== p2Id);

        // Reset players state
        const resetPlayers = { ...state.players };

        // Reset everyone to spectator first (except host keeps host role visually, but functionally plays?)
        // Requirement: "A party can have 1 Host, 2 active players". Host CAN be a player.
        // So we update roles for P1 and P2 to 'player'.

        Object.keys(resetPlayers).forEach(pid => {
            const p = resetPlayers[pid];
            // Reset game state props
            resetPlayers[pid] = {
                ...p,
                role: (pid === state.hostId) ? 'host' : 'spectator', // Reset to default
                characterId: null,
                eliminatedIds: [],
                isReady: true // Auto-ready for match
            };
        });

        // Set active players
        resetPlayers[p1Id].role = (p1Id === state.hostId) ? 'host' : 'player'; // Maintain host role string if host is playing? 
        // Logic complication: The type defines 'host' | 'player' | 'spectator'. 
        // If Host plays, they are effectively a player. But we need to know they are host.
        // Let's assume Role is primarily for Game Logic. Host privileges are checked via state.hostId.
        // So allow Host to have 'player' role during match? 
        // Or keep 'host' and treat 'host' as a valid player role for game logic actions?
        // Let's Keep 'host' role string, but ensure game logic checks (role === 'player' || role === 'host').

        // Actually, simpler: Role is strictly for UI/Logic. 
        // Let's say: 'host' is just a privileged 'spectator' who isn't playing. 
        // If Host plays, they become 'player'? But then we lose the badge?
        // Let's separate Privileges (hostId) from Game Role (active player).
        // Let's set their role to 'player' for the match so logic works easily. 
        // UI can check (id === hostId) to show "Host" badge regardless of role.

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

    if (state.matchStatus !== 'playing' && type !== 'TOGGLE_READY') {
        // Allow some actions in lobby?
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
                    content: `${state.players[playerId]?.name} correctly guessed ${guessedChar.name}!`,
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
                    content: `${state.players[playerId]?.name} guessed ${guessedChar.name} incorrectly. It was ${opponentCharName}!`,
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
