export type { Character } from './characters';

export type PlayerRole = 'host' | 'player' | 'spectator';

export type Player = {
    id: string; // socket/pusher id or session id
    name: string; // display name
    role: PlayerRole;
    characterId: string | null; // The character they are assigned
    eliminatedIds: string[]; // Characters this player has crossed out
    isReady: boolean;
    data?: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wins: number;
};


export type GameType = 'guess-who' | 'word-bomb' | 'connect-4' | 'cah' | 'dots-and-boxes' | 'imposter';

export type GameStatus = 'lobby' | 'selecting' | 'playing' | 'finished';

export type ChatMessage = {
    id: string;
    playerId: string;
    text: string;
    timestamp: number;
    scope: 'party' | 'game';
};

export type Turn = {
    playerId: string;
    action: 'ask' | 'guess' | 'answer' | 'join' | 'WIN' | 'GAME_OVER' | 'info';
    content: string; // The question or the guess
    timestamp: number;
};

// Imposter-specific types
export type ImposterHint = {
    playerId: string;
    hint: string;
    turnNumber: number;
};

export type ImposterVote = {
    voterId: string;
    votedForId: string;
};

export type GameState = {
    roomId: string; // Short code
    gameType: GameType;
    hostId: string;
    players: Record<string, Player>; // All participants (Host, Players, Spectators)
    queue: string[]; // IDs of players waiting to play
    board: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Word Bomb Specific State
    wordBombPrompt?: string; // Current letter sequence to include
    usedWords?: string[]; // Words already used this match
    turnStartTime?: number; // When current turn started (for timer)
    currentTimerDuration?: number; // Current timer in seconds
    currentTyping?: string; // Real-time typing display
    lobbyCountdownStart?: number; // When the 15-second lobby countdown started
    joinedNextRound?: string[]; // Player IDs who clicked "Join Next Round"

    // CAH Specific State
    cahBlackCard?: { text: string; pick: number; }; // Current black card
    cahSubmissions?: { playerId: string; cards: string[]; isWinner?: boolean; isCustom?: boolean; }[];
    cahPhase?: 'pick' | 'judge' | 'result';
    cahCzarId?: string; // Player ID of the Card Czar

    // Dots and Boxes Specific State
    dabLines?: string[]; // Array of line IDs e.g. "v-0-0" (vertical, row, col) or "h-0-0" (horizontal)
    dabBoxes?: Record<string, string>; // Map of "r-c" box coords to owner player ID

    // Imposter Specific State
    imposterMode?: 'text' | 'irl'; // Sub-mode: text hints or IRL speaking
    imposterSecretWord?: string; // The secret word (NOT sent to imposter client)
    imposterHintWord?: string; // Hint word for imposter (first turn only)
    imposterId?: string; // Player ID of the imposter
    imposterTurnNumber?: number; // Current turn number (1-9)
    imposterCurrentPlayerIndex?: number; // Index in player order (0-2)
    imposterPlayerOrder?: string[]; // Fixed turn order for the round
    imposterHints?: ImposterHint[]; // Timeline of hints (Text Mode)
    imposterVotes?: ImposterVote[]; // Votes cast during voting phase
    imposterPhase?: 'reveal' | 'playing' | 'voting' | 'results'; // Current game phase
    imposterScores?: Record<string, number>; // Persistent scores across rounds
    imposterUsedPairs?: number[]; // Indices of used word pairs to avoid repeats
    imposterReadyPlayers?: string[]; // Players who have acknowledged role reveal

    bannedIds: string[]; // IDs of banned players (cached by name hash for persistence)
    chat: ChatMessage[];
    status: GameStatus; // Party Status
    matchStatus: 'lobby' | 'playing' | 'finished'; // Current match status
    turnPlayerId: string | null; // ID of the player whose turn it is
    winnerId: string | null;
    history: Turn[];
    settings: {
        spectatorView: 'log' | 'boards';
        visibility: 'public' | 'unlisted' | 'private';
        cahWinThreshold?: number; // Host-configurable wins needed (default 5)
    };
    cahUsedWhiteCards?: string[]; // Track used cards to prevent duplicates
    createdAt: number;
    // Client-sync
    serverTime?: number;
};

export type CreateRoomParams = {
    hostName: string;
    visibility: GameState['settings']['visibility'];
    gameType: GameType;
};

export type JoinRoomParams = {
    roomId: string;
    playerName: string;
};
