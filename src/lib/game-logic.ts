import { GameState, ChatMessage } from './types';
import { CHARACTERS } from './characters';
import { sanitizeName } from './validation';
import { createConnect4Board, dropPiece, checkConnect4Win, isBoardFull } from './games/connect4';
import { createInitialWordBombData, getRandomPrompt, INITIAL_TIMER_SECONDS, TIMER_DECREASE_PER_ROUND, MIN_TIMER_SECONDS } from './games/word-bomb';
import { BLACK_CARDS, WHITE_CARDS } from './games/cah-data';


export function checkGuess(character: any, question: { category: string, value: any }): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!character) return false;
    return character[question.category] === question.value;
}

export type GameActionEnvelope = {
    playerId: string;
    type: 'ASK' | 'ANSWER' | 'GUESS' | 'END_TURN' | 'TOGGLE_READY' | 'TOGGLE_ELIMINATION' | 'FORFEIT' | 'UPDATE_NAME' | 'CHAT' | 'TOGGLE_QUEUE_PLAYER' | 'START_MATCH' | 'BAN_PLAYER' | 'END_PARTY' | 'REORDER_QUEUE' | 'KICK_PLAYER' | 'DROP_PIECE' | 'SUBMIT_WORD' | 'TIMER_EXPIRED' | 'UPDATE_TYPING' | 'JOIN_NEXT_ROUND' | 'START_WORD_BOMB_MATCH' | 'RESET_LOBBY_TIMER' | 'FORFEIT_WORD' | 'SUBMIT_CARDS' | 'PICK_WINNER' | 'CAH_NEXT_ROUND' | 'LEAVE_QUEUE' | 'TRANSFER_HOST' | 'LEAVE_PARTY' | 'DRAW_LINE' | 'LEAVE_NEXT_ROUND';
    payload?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// Replaced by unified joinGame
export function addSpectator(state: GameState): GameState {
    return state;
}

// Logic to start a match given two player IDs
function startGuessWhoMatch(state: GameState, p1Id: string, p2Id: string): GameState {
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


function startConnect4Match(state: GameState, p1Id: string, p2Id: string): GameState {
    const newQueue = state.queue.filter(id => id !== p1Id && id !== p2Id);
    const resetPlayers = { ...state.players };

    Object.keys(resetPlayers).forEach(pid => {
        resetPlayers[pid] = {
            ...resetPlayers[pid],
            role: 'spectator',
            characterId: null,
            eliminatedIds: [],
            isReady: true
        };
    });

    if (!resetPlayers[p1Id] || !resetPlayers[p2Id]) {
        throw new Error(`Invalid players for match: ${p1Id}, ${p2Id}`);
    }

    // P1 = Red, P2 = Yellow
    resetPlayers[p1Id].role = 'player';
    resetPlayers[p1Id].characterId = 'red';

    resetPlayers[p2Id].role = 'player';
    resetPlayers[p2Id].characterId = 'yellow';

    return {
        ...state,
        players: resetPlayers,
        queue: newQueue,
        status: 'playing',
        matchStatus: 'playing',
        turnPlayerId: p1Id, // Red starts
        winnerId: null,
        board: createConnect4Board(),
        history: [{ playerId: 'system', action: 'join', content: 'Match Started (Connect 4)', timestamp: Date.now() }],
        chat: state.chat.filter(m => m.scope !== 'game'),
    };
}

function startWordBombMatch(state: GameState, p1Id: string, p2Id: string): GameState {
    const newQueue = state.queue.filter(id => id !== p1Id && id !== p2Id);
    const resetPlayers = { ...state.players };

    // Reset everyone
    Object.keys(resetPlayers).forEach(pid => {
        resetPlayers[pid] = {
            ...resetPlayers[pid],
            role: 'spectator',
            characterId: null,
            eliminatedIds: [],
            isReady: true,
            data: null
        };
    });

    if (!resetPlayers[p1Id] || !resetPlayers[p2Id]) {
        throw new Error(`Invalid players for Word Bomb match: ${p1Id}, ${p2Id}`);
    }

    // P1
    resetPlayers[p1Id].role = 'player';
    resetPlayers[p1Id].data = createInitialWordBombData();

    // P2
    resetPlayers[p2Id].role = 'player';
    resetPlayers[p2Id].data = createInitialWordBombData();

    const initialPrompt = getRandomPrompt();

    return {
        ...state,
        players: resetPlayers,
        queue: newQueue,
        status: 'playing',
        matchStatus: 'playing',
        turnPlayerId: p1Id,
        winnerId: null,
        board: null,
        wordBombPrompt: initialPrompt,
        usedWords: [],
        turnStartTime: Date.now(),
        currentTimerDuration: INITIAL_TIMER_SECONDS,
        history: [{ playerId: 'system', action: 'info', content: `Match Started! First prompt: "${initialPrompt}"`, timestamp: Date.now() }],
        chat: state.chat.filter(m => m.scope !== 'game'),
    };
}

function startCAHMatch(state: GameState, p1Id: string, p2Id: string): GameState {
    const newQueue = state.queue.filter(id => id !== p1Id && id !== p2Id);

    // For CAH, "p1" and "p2" are just the triggers really. 
    // Usually CAH includes EVERYONE in the party (except spectators who opt out).
    // But sticking to the pattern: "Active Players vs Spectators".

    // HOWEVER, for CAH, we likely want multiple players.
    // Logic: If there are people in the queue, PULL THEM ALL IN?
    // Or just start with current "Active" set?

    // Implementation: PULL ALL QUEUED PLAYERS into the game for maximum fun.
    // UNLESS the host specifically picked 2 people.
    // Let's stick to: Everyone who is NOT a spectator becomes a player?
    // Or simpler: Convert P1, P2 AND Queue into Players.

    const allPlayerIds = [p1Id, p2Id, ...newQueue]; // Everyone plays!
    const finalQueue: string[] = []; // Queue empty

    const resetPlayers = { ...state.players };

    // Deal Hand Helper
    const dealHand = () => {
        const hand: string[] = [];
        for (let i = 0; i < 7; i++) {
            hand.push(WHITE_CARDS[Math.floor(Math.random() * WHITE_CARDS.length)]);
        }
        return hand;
    };

    // Pick Czar (Random)
    const czarId = allPlayerIds[Math.floor(Math.random() * allPlayerIds.length)];

    // Setup Players
    Object.keys(resetPlayers).forEach(pid => {
        const isParticipant = allPlayerIds.includes(pid);
        resetPlayers[pid] = {
            ...resetPlayers[pid],
            role: isParticipant ? 'player' : 'spectator',
            characterId: null, // Unused for CAH
            eliminatedIds: [],
            isReady: true,
            // Initialize CAH Data: Hand and Score
            data: isParticipant ? {
                hand: dealHand(),
                score: 0,
                isCzar: pid === czarId
            } : null
        };
    });

    // Pick Black Card
    const blackCard = BLACK_CARDS[Math.floor(Math.random() * BLACK_CARDS.length)];

    return {
        ...state,
        players: resetPlayers,
        queue: finalQueue,
        status: 'playing',
        matchStatus: 'playing',
        turnPlayerId: czarId,
        winnerId: null,
        board: null,

        // CAH Specifics
        cahBlackCard: blackCard,
        cahSubmissions: [],
        cahPhase: 'pick',
        cahCzarId: czarId,

        history: [{
            playerId: 'system',
            action: 'info',
            content: `Cards Against Humanity Started! Czar is ${resetPlayers[czarId].name}`,
            timestamp: Date.now()
        }],
        chat: state.chat.filter(m => m.scope !== 'game'),
    };
}


export function createInitialGameState(
    roomId: string,
    hostName: string,
    hostId: string,
    gameType: GameState['gameType'],
    settings: GameState['settings']
): GameState {
    return {
        roomId,
        gameType,
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
        board: null,
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
        // CAH requires 3+ players, so don't auto-start
        if (state.gameType === 'cah') {
            // For CAH: Add both players to queue and wait for more
            return {
                ...stateWithP2,
                queue: [state.hostId, playerId]
            };
        } else if (state.gameType === 'guess-who') {
            return startGuessWhoMatch(stateWithP2, state.hostId, playerId);
        } else if (state.gameType === 'connect-4') {
            return startConnect4Match(stateWithP2, state.hostId, playerId);
        } else if (state.gameType === 'word-bomb') {
            return startWordBombMatch(stateWithP2, state.hostId, playerId);
        } else if (state.gameType === 'dots-and-boxes') {
            return startDotsAndBoxesMatch(stateWithP2);
        }

        return stateWithP2;
    }

    // Otherwise join as spectator (or queue for CAH)
    const newPlayer = {
        id: playerId,
        name: playerName,
        role: 'spectator' as const,
        characterId: null,
        eliminatedIds: [],
        isReady: false,
        wins: 0,
    };

    // For CAH: Everyone joins the queue automatically during lobby
    if (state.gameType === 'cah' && state.matchStatus === 'lobby') {
        return {
            ...state,
            players: {
                ...state.players,
                [playerId]: { ...newPlayer, role: 'player' }
            },
            queue: [...state.queue, playerId]
        };
    }

    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: newPlayer
        }
    };
}

// --- DOTS AND BOXES LOGIC ---
export const startDotsAndBoxesMatch = (gameState: GameState): GameState => {
    // 3x3 Grid of boxes
    const activePlayers = Object.values(gameState.players)
        .filter(p => gameState.queue.length >= 2 ? gameState.queue.slice(0, 2).includes(p.id) : (p.role === 'player' || (p.role === 'host' && gameState.queue.length < 2)))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 2);

    if (activePlayers.length < 2) {
        throw new Error('Not enough players for Dots and Boxes (need 2)');
    }

    const p1 = activePlayers[0];
    const p2 = activePlayers[1];

    // Assign colors / IDs
    // We reuse characterId for color: 'red' vs 'blue'
    const newPlayers = { ...gameState.players };
    newPlayers[p1.id] = { ...p1, role: 'player', characterId: 'red', wins: p1.wins || 0 };
    newPlayers[p2.id] = { ...p2, role: 'player', characterId: 'blue', wins: p2.wins || 0 };

    // Reset others to spectators
    Object.keys(newPlayers).forEach(pid => {
        if (pid !== p1.id && pid !== p2.id) {
            newPlayers[pid] = { ...newPlayers[pid], role: 'spectator', characterId: null };
        }
    });

    return {
        ...gameState,
        gameType: 'dots-and-boxes',
        matchStatus: 'playing',
        players: newPlayers,
        turnPlayerId: p1.id,
        dabLines: [],
        dabBoxes: {},
        history: [{
            playerId: 'system',
            action: 'info',
            content: `Match started: ${p1.name} (Red) vs ${p2.name} (Blue)`,
            timestamp: Date.now()
        }]
    };
};


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
    if (type === 'BAN_PLAYER' || type === 'KICK_PLAYER') {
        if (state.hostId !== playerId) throw new Error('Only host can kick/ban players');

        const targetId = payload?.targetId;
        if (!targetId) return state;
        if (targetId === state.hostId) throw new Error('Cannot kick yourself');

        const targetPlayer = state.players[targetId];
        if (!targetPlayer) return state;

        // Is this a ban or just a kick?
        const isBan = type === 'BAN_PLAYER';

        // Remove from players
        const newPlayers = { ...state.players };
        delete newPlayers[targetId];

        // Remove from queue
        const newQueue = state.queue.filter(id => id !== targetId);

        // Update banned IDs if banning
        let newBannedIds = state.bannedIds;
        if (isBan) {
            const nameHash = `name:${targetPlayer.name.toLowerCase().trim()}`;
            newBannedIds = [...(state.bannedIds || []), targetId, nameHash];
        }

        // If Active Match involved this player, END IT
        let newMatchStatus = state.matchStatus;
        let newWinnerId = state.winnerId;
        let newHistory = state.history;

        // Check if kicked player was active in a playing match
        if (state.matchStatus === 'playing') {
            const wasActive = targetPlayer.role === 'player' || (targetPlayer.role === 'host' && targetPlayer.characterId);
            if (wasActive) {
                newMatchStatus = 'finished';
                newWinnerId = null; // No winner logic as requested
                newHistory = [...state.history, {
                    playerId: 'system',
                    action: 'GAME_OVER',
                    content: `Player ${targetPlayer.name} was kicked by Host. Match ended (No Contest).`,
                    timestamp: Date.now()
                }];
            }
        }

        return {
            ...state,
            players: newPlayers,
            queue: newQueue,
            bannedIds: newBannedIds,
            matchStatus: newMatchStatus,
            winnerId: newWinnerId,
            history: newHistory
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

        if (state.gameType === 'guess-who') {
            return startGuessWhoMatch(stateWithQueue, p1Id, p2Id);
        } else if (state.gameType === 'connect-4') {
            return startConnect4Match(stateWithQueue, p1Id, p2Id);
        } else if (state.gameType === 'word-bomb') {
            return startWordBombMatch(stateWithQueue, p1Id, p2Id);
        } else if (state.gameType === 'cah') {
            // CAH requires minimum 3 players
            if (currentQueue.length < 3) {
                throw new Error('Cards Against Humanity requires at least 3 players');
            }
            return startCAHMatch(stateWithQueue, p1Id, p2Id);
        } else if (state.gameType === 'dots-and-boxes') {
            return startDotsAndBoxesMatch({ ...stateWithQueue, queue: currentQueue });
        }

        return stateWithQueue; // Placeholder for other games
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
            winnerId: opponentId || null,
            players: (opponentId) ? {
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
                    ? `Game ended by Host. ${state.players[opponentId || '']?.name || 'Opponent'} wins!`
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

        let nextPlayerId: string | undefined;
        // Standard round-robin for >2 players, or toggle for 2 players
        const currentIndex = activeIds.indexOf(playerId);
        if (currentIndex >= 0) {
            nextPlayerId = activeIds[(currentIndex + 1) % activeIds.length];
        }

        return {
            ...state,
            turnPlayerId: nextPlayerId ?? null,
        };
    }

    if (type === 'REORDER_QUEUE') {
        if (state.hostId !== playerId) throw new Error('Only host can reorder queue');
        const newQueue: string[] = payload; // Array of player IDs

        // Validation: Ensure newQueue has same elements as old queue
        const oldSet = new Set(state.queue);
        const newSet = new Set(newQueue);

        if (oldSet.size !== newSet.size || !newQueue.every(id => oldSet.has(id))) {
            throw new Error('Invalid queue reorder payload');
        }

        return {
            ...state,
            queue: newQueue,
        };
    }

    if (type === 'LEAVE_QUEUE') {
        if (!state.queue.includes(playerId)) return state;

        const newQueue = state.queue.filter(id => id !== playerId);

        // If CAH, revert role to spectator when leaving queue
        let newPlayers = state.players;
        if (state.gameType === 'cah') {
            newPlayers = {
                ...state.players,
                [playerId]: { ...state.players[playerId], role: 'spectator' }
            };
        }

        return {
            ...state,
            queue: newQueue,
            players: newPlayers
        };
    }

    if (type === 'TRANSFER_HOST') {
        if (state.hostId !== playerId) throw new Error('Only host can transfer crown');
        const targetId = payload?.targetId;
        if (!targetId || !state.players[targetId]) throw new Error('Invalid target');

        return {
            ...state,
            hostId: targetId,
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `Host transferred to ${state.players[targetId].name}`,
                timestamp: Date.now()
            }]
        };
    }

    if (type === 'LEAVE_PARTY') {
        // Remove player from players and queue
        const newPlayers = { ...state.players };
        delete newPlayers[playerId];

        const newQueue = state.queue.filter(id => id !== playerId);

        // If host leaves, assign new host randomly or end?
        let newHostId = state.hostId;
        if (state.hostId === playerId) {
            const remainingIds = Object.keys(newPlayers);
            if (remainingIds.length > 0) {
                newHostId = remainingIds[0]; // Just pick first available
            } else {
                // No one left, party effectively dead (handled by server cleanup usually)
                newHostId = '';
            }
        }

        return {
            ...state,
            players: newPlayers,
            queue: newQueue,
            hostId: newHostId,
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `${state.players[playerId]?.name || 'Unknown'} left the party`,
                timestamp: Date.now()
            }]
        };
    }

    if (type === 'DROP_PIECE') {
        if (state.gameType !== 'connect-4') throw new Error('Invalid game type for DROP_PIECE');
        if (state.matchStatus !== 'playing') return state;
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        const col = payload;
        const player = state.players[playerId];
        const color = player.characterId as 'red' | 'yellow'; // P1 is red, P2 is yellow

        const result = dropPiece(state.board, col, color);

        if (!result.success) {
            // Invalid move (column full), do nothing or throw?
            // User UI should prevent this, but just return state if it happens
            return state;
        }

        const newBoard = result.newBoard;
        let winnerId: string | null = null;
        let matchStatus: GameState['matchStatus'] = 'playing';
        let history = state.history;

        // Check Win
        if (checkConnect4Win(newBoard, result.row, col, color)) {
            winnerId = playerId;
            matchStatus = 'finished';
            history = [...history, {
                playerId: 'system',
                action: 'WIN',
                content: `${player.name} wins Connect 4!`,
                timestamp: Date.now()
            }];
        } else if (isBoardFull(newBoard)) {
            // Draw
            matchStatus = 'finished';
            history = [...history, {
                playerId: 'system',
                action: 'GAME_OVER',
                content: 'Draw - Board Full',
                timestamp: Date.now()
            }];
        }

        // Switch Turn
        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player')
            .map(p => p.id);
        const opponentId = activeIds.find(id => id !== playerId);

        // Update wins if winner
        const players = { ...state.players };
        if (winnerId) {
            players[winnerId] = {
                ...players[winnerId],
                wins: (players[winnerId].wins || 0) + 1
            };
        }

        return {
            ...state,
            board: newBoard,
            turnPlayerId: matchStatus === 'playing' ? (opponentId || null) : null,
            winnerId,
            matchStatus,
            players,
            history
        };
    }

    // --- WORD BOMB ACTIONS ---
    if (type === 'SUBMIT_WORD') {
        if (state.gameType !== 'word-bomb') throw new Error('Invalid game type');
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');
        if (state.matchStatus !== 'playing') return state;

        const word = (payload?.word || '').toLowerCase().trim();
        const prompt = state.wordBombPrompt || '';
        const usedWords = state.usedWords || [];

        // Validation: word must contain prompt
        if (!word.includes(prompt.toLowerCase())) {
            return {
                ...state,
                history: [...state.history, {
                    playerId,
                    action: 'info',
                    content: `"${word}" doesn't contain "${prompt}"!`,
                    timestamp: Date.now()
                }]
            };
        }

        // Validation: word must not be already used
        if (usedWords.includes(word)) {
            return {
                ...state,
                history: [...state.history, {
                    playerId,
                    action: 'info',
                    content: `"${word}" was already used!`,
                    timestamp: Date.now()
                }]
            };
        }

        // Word is valid! Next player's turn
        const newUsedWords = [...usedWords, word];
        const newPrompt = getRandomPrompt();

        const activePlayers = Object.values(state.players).filter(p => p.role === 'player' && !p.data?.isEliminated);
        const currentIndex = activePlayers.findIndex(p => p.id === playerId);
        const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];

        // --- TIMER LOGIC (Step-based) ---
        // Base: 20s
        // >5 loops: 15s
        // >10 loops: 10s
        // >15 loops: 7s
        const playerCount = Math.max(1, activePlayers.length);
        const totalTurns = newUsedWords.length;
        const loops = Math.floor(totalTurns / playerCount);

        let newTimer = INITIAL_TIMER_SECONDS; // 20
        if (loops >= 15) newTimer = 7;
        else if (loops >= 10) newTimer = 10;
        else if (loops >= 5) newTimer = 15;

        // --- ALPHABET LOGIC ---
        const player = state.players[playerId];
        const currentData = player.data as any;
        const usedLetters = new Set([...(currentData.usedLetters || []), ...word.split('')]);
        const newUsedLetters = Array.from(usedLetters);

        // Check for 26 letters (English alphabet)
        const alphabetCount = newUsedLetters.filter(l => /[a-z]/i.test(l)).length; // rudimentary check, assume sanitized input
        // Actually, just checking unique chars is safer if we trust input is letters.
        // Let's rely on sanitized input being alphabetic.

        let newLives = currentData.lives;
        let hasReceivedGoldenHeart = currentData.hasReceivedGoldenHeart;
        let notificationMsg = `✓ "${word}" accepted!`;

        const ALPHABET_SIZE = 26; // User said 27? "all 27 letters of the english alphabet". English has 26. Maybe they count space? Words don't have spaces. I'll assume 26.
        // Wait, user explicitly said "27 letters". Maybe they made a typo or think there are 27. I will use 26 as standard English.

        if (alphabetCount >= ALPHABET_SIZE && !hasReceivedGoldenHeart) {
            hasReceivedGoldenHeart = true;
            // Reward: Add life (Golden Heart if at max)
            // Max base is 2. So if 2 -> 3.
            newLives = Math.min(3, newLives + 1);
            notificationMsg = `🎉 ALPHABET COMPLETE! Golden Heart Awarded! ❤️`;
        }

        const updatedPlayer = {
            ...player,
            data: {
                ...currentData,
                lives: newLives,
                usedLetters: newUsedLetters,
                hasReceivedGoldenHeart
            }
        };

        const newPlayers = {
            ...state.players,
            [playerId]: updatedPlayer
        };


        return {
            ...state,
            players: newPlayers,
            usedWords: newUsedWords,
            wordBombPrompt: newPrompt,
            turnPlayerId: nextPlayer?.id || null,
            turnStartTime: Date.now(),
            currentTimerDuration: newTimer,
            currentTyping: '', // Reset typing status
            history: [...state.history, {
                playerId,
                action: 'info',
                content: `${notificationMsg} New prompt: "${newPrompt}"`,
                timestamp: Date.now()
            }]
        };
    }

    if (type === 'TIMER_EXPIRED') {
        if (state.gameType !== 'word-bomb') throw new Error('Invalid game type');
        if (state.matchStatus !== 'playing') return state;

        const currentPlayerId = state.turnPlayerId;
        if (!currentPlayerId) return state;

        const newPlayers = { ...state.players };
        const player = newPlayers[currentPlayerId];
        if (!player || !player.data) return state;

        // Lose a life
        const newLives = (player.data.lives || 0) - 1;
        newPlayers[currentPlayerId] = {
            ...player,
            data: { ...player.data, lives: newLives, isEliminated: newLives <= 0 }
        };

        // Check for winner
        const remainingPlayers = Object.values(newPlayers).filter(
            p => p.role === 'player' && !p.data?.isEliminated
        );

        if (remainingPlayers.length <= 1) {
            const winnerId = remainingPlayers[0]?.id || null;
            if (winnerId && newPlayers[winnerId]) {
                newPlayers[winnerId] = {
                    ...newPlayers[winnerId],
                    wins: (newPlayers[winnerId]?.wins || 0) + 1
                };
            }

            // Start 15-second lobby for next round
            // Winner is auto-joined
            return {
                ...state,
                players: newPlayers,
                matchStatus: 'finished',
                winnerId,
                turnPlayerId: null,
                lobbyCountdownStart: Date.now(),
                // Auto-join all current players for the next round
                joinedNextRound: Object.values(state.players).filter(p => p.role === 'player').map(p => p.id),
                history: [...state.history, {
                    playerId: 'system',
                    action: 'WIN',
                    content: `💥 ${player.name} ran out of time and lives! ${remainingPlayers[0]?.name || 'Nobody'} wins! Next round in 15 seconds...`,
                    timestamp: Date.now()
                }]
            };
        }

        // Get next player (skip eliminated)
        const currentIndex = remainingPlayers.findIndex(p => p.id === currentPlayerId);
        let nextIndex = currentIndex;
        if (newLives <= 0) {
            // Current player eliminated, they're removed from list
            nextIndex = currentIndex % remainingPlayers.length;
        } else {
            nextIndex = (currentIndex + 1) % remainingPlayers.length;
        }
        const nextPlayer = remainingPlayers[nextIndex];

        const newPrompt = getRandomPrompt();

        return {
            ...state,
            players: newPlayers,
            wordBombPrompt: newPrompt,
            turnPlayerId: nextPlayer?.id || null,
            turnStartTime: Date.now(),
            currentTyping: '', // Reset typing status
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `💥 ${player.name} ran out of time! ${newLives > 0 ? `${newLives} lives left.` : 'ELIMINATED!'} New prompt: "${newPrompt}"`,
                timestamp: Date.now()
            }]
        };
    }

    // Update typing display in real-time
    if (type === 'UPDATE_TYPING') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.turnPlayerId !== playerId) return state; // Only current player can update

        return {
            ...state,
            currentTyping: payload?.text || ''
        };
    }

    // Join next round during lobby
    if (type === 'JOIN_NEXT_ROUND') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.matchStatus !== 'finished') return state;

        const currentJoined = state.joinedNextRound || [];
        if (currentJoined.includes(playerId)) return state; // Already joined

        return {
            ...state,
            joinedNextRound: [...currentJoined, playerId],
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `${state.players[playerId]?.name || 'Someone'} joined next round!`,
                timestamp: Date.now()
            }]
        };
    }

    if (type === 'LEAVE_NEXT_ROUND') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.matchStatus !== 'finished') return state;

        const currentJoined = state.joinedNextRound || [];
        if (!currentJoined.includes(playerId)) return state;

        return {
            ...state,
            joinedNextRound: currentJoined.filter(id => id !== playerId),
            history: state.history // No history spam for leaving? Or maybe verbose is fine.
        };
    }

    // Start Word Bomb match with all joined players
    if (type === 'START_WORD_BOMB_MATCH') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.matchStatus !== 'finished') return state;

        const joinedPlayers = state.joinedNextRound || [];
        if (joinedPlayers.length < 2) return state; // Need at least 2 players

        const newPlayers = { ...state.players };

        // Reset everyone to spectator first
        Object.keys(newPlayers).forEach(pid => {
            newPlayers[pid] = {
                ...newPlayers[pid],
                role: 'spectator',
                data: null
            };
        });

        // Set joined players as active players
        joinedPlayers.forEach(pid => {
            if (newPlayers[pid]) {
                newPlayers[pid].role = 'player';
                newPlayers[pid].data = createInitialWordBombData();
            }
        });

        const initialPrompt = getRandomPrompt();

        return {
            ...state,
            players: newPlayers,
            status: 'playing',
            matchStatus: 'playing',
            turnPlayerId: joinedPlayers[0],
            winnerId: null,
            board: null,
            wordBombPrompt: initialPrompt,
            usedWords: [],
            turnStartTime: Date.now(),
            currentTimerDuration: INITIAL_TIMER_SECONDS,
            currentTyping: '',
            lobbyCountdownStart: undefined,
            joinedNextRound: undefined,
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `New round started with ${joinedPlayers.length} players! Prompt: "${initialPrompt}"`,
                timestamp: Date.now()
            }]
        };
    }

    // Reset Lobby Timer (looping mechanic)
    if (type === 'RESET_LOBBY_TIMER') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.matchStatus !== 'finished') return state;

        return {
            ...state,
            lobbyCountdownStart: Date.now()
        };
    }

    // Give Up / Forfeit Word (Lose a life immediately)
    if (type === 'FORFEIT_WORD') {
        if (state.gameType !== 'word-bomb') return state;
        if (state.turnPlayerId !== playerId) return state; // Only current player can yield

        // Using same logic as TIMER_EXPIRED but explicit
        // We can actually just recurse or copy logic. Copying for safety/clarity.

        const newPlayers = { ...state.players };
        const player = newPlayers[playerId];
        if (!player || !player.data) return state;

        const newLives = (player.data.lives || 0) - 1;
        newPlayers[playerId] = {
            ...player,
            data: { ...player.data, lives: newLives, isEliminated: newLives <= 0 }
        };

        // Check for winner
        const remainingPlayers = Object.values(newPlayers).filter(
            p => p.role === 'player' && !p.data?.isEliminated
        );

        if (remainingPlayers.length <= 1) {
            const winnerId = remainingPlayers[0]?.id || null;
            if (winnerId && newPlayers[winnerId]) {
                newPlayers[winnerId] = {
                    ...newPlayers[winnerId],
                    wins: (newPlayers[winnerId]?.wins || 0) + 1
                };
            }

            return {
                ...state,
                players: newPlayers,
                matchStatus: 'finished',
                winnerId,
                turnPlayerId: null,
                lobbyCountdownStart: Date.now(),
                // Auto-join all current players for the next round
                joinedNextRound: Object.values(state.players).filter(p => p.role === 'player').map(p => p.id),
                history: [...state.history, {
                    playerId: 'system',
                    action: 'WIN',
                    content: `💥 ${player.name} gave up! ${remainingPlayers[0]?.name || 'Nobody'} wins! Next round in 15 seconds...`,
                    timestamp: Date.now()
                }]
            };
        }

        // Get next player
        const activePlayers = Object.values(state.players).filter(p => p.role === 'player' && !p.data?.isEliminated);
        const currentIndex = activePlayers.findIndex(p => p.id === playerId);
        const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
        const newPrompt = getRandomPrompt();

        return {
            ...state,
            players: newPlayers,
            wordBombPrompt: newPrompt,
            turnPlayerId: nextPlayer?.id || null,
            turnStartTime: Date.now(),
            currentTyping: '', // Reset typing status
            currentTimerDuration: INITIAL_TIMER_SECONDS, // Reset timer for next player? Usually yes.
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `💥 ${player.name} gave up! ${newLives} lives left. New prompt: "${newPrompt}"`,
                timestamp: Date.now()
            }]
        };
    }

    // --- CAH ACTIONS ---
    if (type === 'SUBMIT_CARDS') {
        if (state.gameType !== 'cah') throw new Error('Invalid game type');
        if (state.matchStatus !== 'playing') return state;

        // Cannot submit if Czar
        if (playerId === state.cahCzarId) return state;

        // Cannot submit twice
        if (state.cahSubmissions?.find(s => s.playerId === playerId)) return state;

        const cards: string[] = payload; // Array of card texts
        const blackCard = state.cahBlackCard;

        // Validate count
        // if (!blackCard || cards.length !== blackCard.pick) {
        // throw new Error(`Must submit exactly ${blackCard?.pick} cards`);
        // }
        // Relax check for MVP if client sends robustly? 
        // No, keep it strict.
        if (!blackCard) return state;

        // Remove submitted cards from hand
        const player = state.players[playerId];
        const currentHand = (player.data?.hand as string[]) || [];
        const newHand = currentHand.filter(c => !cards.includes(c));

        const newSubmissions = [...(state.cahSubmissions || []), {
            playerId,
            cards,
            isWinner: false
        }];

        // Check if everyone submitted
        // Everyone except Czar and specific spectators
        // Active Players = Players who have 'data' initialized (hand)
        // Wait, startCAHMatch initialized 'data' for participants.
        // Spectators have data:null.
        const activePlayers = Object.values(state.players).filter(p => p.role === 'player' && !!p.data && p.id !== state.cahCzarId);
        const allSubmitted = activePlayers.every(p => newSubmissions.find(s => s.playerId === p.id));

        let newPhase = state.cahPhase;
        if (allSubmitted && activePlayers.length > 0) {
            newPhase = 'judge';
        }

        const newPlayers = {
            ...state.players,
            [playerId]: {
                ...player,
                data: { ...player.data, hand: newHand }
            }
        };

        return {
            ...state,
            players: newPlayers,
            cahSubmissions: newSubmissions,
            cahPhase: newPhase,
            history: allSubmitted
                ? [...state.history, { playerId: 'system', action: 'info', content: 'All players submitted! Czar is judging.', timestamp: Date.now() }]
                : state.history
        };
    }

    if (type === 'PICK_WINNER') {
        if (state.gameType !== 'cah') throw new Error('Invalid game type');
        if (state.matchStatus !== 'playing') return state;
        if (playerId !== state.cahCzarId) throw new Error('Only Czar can pick winner');
        if (state.cahPhase !== 'judge') throw new Error('Not judging phase');

        const winningPlayerId = payload; // ID of winner

        // Mark winner
        const submission = state.cahSubmissions?.find(s => s.playerId === winningPlayerId);
        if (!submission) throw new Error('Invalid winner selection');

        // Update score
        const winningPlayer = state.players[winningPlayerId];
        const newScore = (winningPlayer.data?.score || 0) + 1;

        const newPlayers = {
            ...state.players,
            [winningPlayerId]: {
                ...winningPlayer,
                data: { ...winningPlayer.data, score: newScore }
            }
        };

        // Check for game over (5 wins)
        const CAH_WIN_THRESHOLD = 5;
        const isGameOver = newScore >= CAH_WIN_THRESHOLD;

        return {
            ...state,
            players: newPlayers,
            cahPhase: isGameOver ? 'result' : 'result',
            cahSubmissions: state.cahSubmissions?.map(s => s.playerId === winningPlayerId ? { ...s, isWinner: true } : s),
            winnerId: winningPlayerId,
            matchStatus: isGameOver ? 'finished' : 'playing',
            status: isGameOver ? 'lobby' : state.status,
            turnPlayerId: null,
            history: [...state.history, {
                playerId: 'system',
                action: 'WIN',
                content: isGameOver
                    ? `${winningPlayer.name} WINS THE GAME with ${newScore} points! 🏆`
                    : `${winningPlayer.name} wins the round! (${newScore}/${CAH_WIN_THRESHOLD})`,
                timestamp: Date.now()
            }]
        };
    }

    // CAH Next Round Logic (Piggybacking off START_MATCH or specialized handling)
    // We already intercepted START_MATCH? No, we didn't add logic there.
    // Let's add it here as a post-condition check or new action "CAH_NEXT_ROUND"

    // Actually, let's keep it simple: Host triggers "START_MATCH" (Start Next Match button).
    // In `START_MATCH` logic (Lines ~440), we have generic logic.
    // BUT we can add a specific override below if that logic doesn't suffice.
    // However, START_MATCH resets everything via `startCAHMatch`.
    // We want to PRESERVE scores.
    // So `startCAHMatch` is too destructive. 
    // We need `startCAHRound` really. 
    // Let's implement `CAH_NEXT_ROUND` action here.
    if (type === 'CAH_NEXT_ROUND') {
        if (state.gameType !== 'cah') return state;
        if (state.cahPhase !== 'result') return state;

        // 1. Rotate Czar
        // Get generic active players list (exclude pure spectators)
        const activeIds = Object.values(state.players)
            .filter(p => p.role === 'player')
            .map(p => p.id)
            .sort();

        const currentCzarIndex = activeIds.indexOf(state.cahCzarId || '');
        const nextCzarId = activeIds[(currentCzarIndex + 1) % activeIds.length] || activeIds[0];

        // 2. Deal new cards
        const newPlayers = { ...state.players };
        Object.keys(newPlayers).forEach(pid => {
            const p = newPlayers[pid];
            if (p.role === 'player') {
                const currentHand = (p.data?.hand as string[]) || [];
                const needed = 7 - currentHand.length;
                const newCards: string[] = [];
                for (let i = 0; i < needed; i++) {
                    newCards.push(WHITE_CARDS[Math.floor(Math.random() * WHITE_CARDS.length)]);
                }

                newPlayers[pid] = {
                    ...p,
                    data: {
                        ...p.data,
                        hand: [...currentHand, ...newCards],
                        isCzar: pid === nextCzarId
                    }
                };
            }
        });

        // 3. New Black Card
        const newBlackCard = BLACK_CARDS[Math.floor(Math.random() * BLACK_CARDS.length)];

        return {
            ...state,
            players: newPlayers,
            cahBlackCard: newBlackCard,
            cahSubmissions: [],
            cahPhase: 'pick',
            cahCzarId: nextCzarId,
            turnPlayerId: nextCzarId,
            winnerId: null, // Reset round winner
            history: [...state.history, {
                playerId: 'system',
                action: 'info',
                content: `Next Round! Czar is ${newPlayers[nextCzarId].name}`,
                timestamp: Date.now()
            }]
        };
    }

    // --- DOTS AND BOXES ACTIONS ---
    if (type === 'DRAW_LINE') {
        if (state.gameType !== 'dots-and-boxes') throw new Error('Invalid game type');
        if (state.matchStatus !== 'playing') return state;
        if (state.turnPlayerId !== playerId) throw new Error('Not your turn');

        const lineId: string = payload; // "h-0-0" or "v-0-0"

        // Validation: Line must not be drawn yet
        if (state.dabLines?.includes(lineId)) throw new Error('Line already drawn');

        const newLines = [...(state.dabLines || [])];
        const newBoxes = { ...(state.dabBoxes || {}) };

        // Queue of lines to process (starting with the user's move)
        const linesToProcess = [lineId];
        let boxesCompleted = 0;
        let totalClaimedThisTurn = 0;

        // Helper to check if a box is claimable (has 3 sides drawn) or completed
        const isBoxComplete = (r: number, c: number, currentLines: string[]): boolean => {
            const top = currentLines.includes(`h-${r}-${c}`);
            const bottom = currentLines.includes(`h-${r + 1}-${c}`);
            const left = currentLines.includes(`v-${r}-${c}`);
            const right = currentLines.includes(`v-${r}-${c + 1}`);
            return top && bottom && left && right;
        };

        const getMissingSide = (r: number, c: number, currentLines: string[]): string | null => {
            const sides = [
                { id: `h-${r}-${c}`, present: currentLines.includes(`h-${r}-${c}`) },
                { id: `h-${r + 1}-${c}`, present: currentLines.includes(`h-${r + 1}-${c}`) },
                { id: `v-${r}-${c}`, present: currentLines.includes(`v-${r}-${c}`) },
                { id: `v-${r}-${c + 1}`, present: currentLines.includes(`v-${r}-${c + 1}`) }
            ];
            const missing = sides.filter(s => !s.present);
            return missing.length === 1 ? missing[0].id : null;
        };

        // Process Loop
        while (linesToProcess.length > 0) {
            const currentLine = linesToProcess.shift()!;

            // If already drawn, skip (should only happen if auto-chain adds a duplicate, but safety first)
            if (newLines.includes(currentLine) && currentLine !== lineId) continue;

            if (!newLines.includes(currentLine)) {
                newLines.push(currentLine);
            }

            // Check neighbors of this line
            const [dir, rStr, cStr] = currentLine.split('-');
            const r = parseInt(rStr);
            const c = parseInt(cStr);

            const boxesToCHeck: { r: number, c: number }[] = [];

            if (dir === 'h') {
                boxesToCHeck.push({ r, c });         // Below
                boxesToCHeck.push({ r: r - 1, c }); // Above
            } else {
                boxesToCHeck.push({ r, c });         // Right
                boxesToCHeck.push({ r, c: c - 1 }); // Left
            }

            let madeBox = false;

            for (const box of boxesToCHeck) {
                if (box.r < 0 || box.c < 0 || box.r >= 5 || box.c >= 5) continue;
                if (newBoxes[`${box.r}-${box.c}`]) continue; // Already owned

                if (isBoxComplete(box.r, box.c, newLines)) {
                    // Claim it!
                    newBoxes[`${box.r}-${box.c}`] = playerId;
                    boxesCompleted++;
                    totalClaimedThisTurn++;
                    madeBox = true;

                    // Now see if this box formation opens up neighbors? 
                    // No, filling a box doesn't inherently open a neighbor, 
                    // BUT adding the *missing line* to fill it might have triggered OTHER boxes.
                    // Wait, the logic is: 
                    // 1. User adds line.
                    // 2. We check if that line closed a box.
                    // 3. IF we closed a box (or more), we keep turn.
                    // 4. ALSO, we check the ENTIRE board for any NEW 3-sided boxes that we can claim "eloquently"?
                    // Actually, standard "chaining" in the user request likely refers to:
                    // "If I close a box, and that move effectively gives me a free line that ALSO closes another box, do it."
                    // But in standard Dots & Boxes, you have to make the move.
                    // "When boxes can connect eloquently, they should" implies automation.
                    // So: After claiming a box, scan neighbors for 3-sided setups. 
                    // Since we just added a line, we might have created a 3-sided scenario (which is bad strategy usually) 
                    // OR we filled a 4th side.

                    // Let's implement robust auto-fill:
                    // Whenever we add a line, we scan neighbors. If a neighbor is NOW a 3-sided box (waiting for 4th), 
                    // we AUTOMATICALLY ADD that 4th line and claim it, 
                    // then repeat based on THAT new line.
                }
            }

            // If we made a box, we might have opportunities to chain.
            // Scan for any 3-sided boxes adjacent to the line we just placed?
            // Actually, simply scanning the whole board or just neighbors for 3-sidedness is the key.
            // Efficient approach: Scan neighbors of the currentLine. 
            // If any neighbor box has 3 sides present, ADD the missing side to `linesToProcess`.

            // Re-check neighbors for 3-sided state ONLY if we made a box (Auto-chaining)
            if (madeBox) {
                for (const box of boxesToCHeck) {
                    if (box.r < 0 || box.c < 0 || box.r >= 5 || box.c >= 5) continue;
                    if (newBoxes[`${box.r}-${box.c}`]) continue;

                    const missing = getMissingSide(box.r, box.c, newLines);
                    if (missing) {
                        // Auto-draw this line!
                        if (!linesToProcess.includes(missing) && !newLines.includes(missing)) {
                            linesToProcess.push(missing);
                        }
                    }
                }
            }
        }

        // Check Win (Total 25 boxes)
        const totalBoxesOwned = Object.keys(newBoxes).length;
        let matchStatus: GameState['matchStatus'] = 'playing';
        let winnerId: string | null = null;
        let turnPlayerId = state.turnPlayerId;

        let history = state.history;

        if (boxesCompleted > 0) {
            // Player gets another turn!
            history = [...history, {
                playerId: 'system',
                action: 'info',
                content: `${state.players[playerId].name} claimed ${boxesCompleted} box(es)${boxesCompleted > 1 ? ' (Chain!)' : ''}!`,
                timestamp: Date.now()
            }];
        } else {
            // Switch turn
            const activeIds = Object.values(state.players)
                .filter(p => p.role === 'player')
                .map(p => p.id);
            const currentIdx = activeIds.indexOf(playerId);
            const nextId = activeIds[(currentIdx + 1) % activeIds.length];
            turnPlayerId = nextId;
        }

        const players = { ...state.players };

        if (totalBoxesOwned === 25) {
            matchStatus = 'finished';
            // Count scores
            const p1 = Object.values(players).find(p => p.role === 'player' && p.characterId === 'red');
            const p2 = Object.values(players).find(p => p.role === 'player' && p.characterId === 'blue');

            const p1Score = Object.values(newBoxes).filter(id => id === p1?.id).length;
            const p2Score = Object.values(newBoxes).filter(id => id === p2?.id).length;

            if (p1Score > p2Score) {
                winnerId = p1?.id || null;
            } else if (p2Score > p1Score) {
                winnerId = p2?.id || null;
            }
            // else draw

            let winnerName: string | undefined;
            if (winnerId !== null) {
                const winnerIdStr: string = winnerId as string;
                const winner = players[winnerIdStr];
                if (winner) {
                    winner.wins = (winner.wins || 0) + 1;
                    winnerName = winner.name;
                }
            }

            history = [...history, {
                playerId: 'system',
                action: 'WIN',
                content: winnerName
                    ? `${winnerName} wins Dots & Boxes (${Math.max(p1Score, p2Score)}-${Math.min(p1Score, p2Score)})!`
                    : `Draw! (${p1Score}-${p2Score})`,
                timestamp: Date.now()
            }];
        }

        return {
            ...state,
            dabLines: newLines,
            dabBoxes: newBoxes,
            turnPlayerId: matchStatus === 'finished' ? null : turnPlayerId,
            matchStatus,
            players,
            winnerId,
            history
        };
    }

    return state;
}

