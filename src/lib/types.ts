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


export type GameType = 'guess-who' | 'monopoly' | 'connect-4';

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

export type GameState = {
    roomId: string; // Short code
    gameType: GameType;
    hostId: string;
    players: Record<string, Player>; // All participants (Host, Players, Spectators)
    queue: string[]; // IDs of players waiting to play
    board: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Monopoly Specific State
    auction?: {
        propertyId: number;
        currentBid: number;
        highBidderId: string | null;
        activeBidders: string[]; // List of players still in the auction
        timerStart?: number; // For timeouts (optional MVP)
    } | null;
    monopolyStatus?: 'waiting_for_roll' | 'waiting_for_decision' | 'auction' | 'jail_decision';

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
    };
    createdAt: number;
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
