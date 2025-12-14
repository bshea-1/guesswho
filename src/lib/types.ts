export type { Character } from './characters';

export type PlayerRole = 'host' | 'player' | 'spectator';

export type Player = {
    id: string; // socket/pusher id or session id
    name: string; // display name
    role: PlayerRole;
    characterId: string | null; // The character they are assigned
    eliminatedIds: string[]; // Characters this player has crossed out
    isReady: boolean;
    wins: number;
};

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
    action: 'ask' | 'guess' | 'answer' | 'join' | 'WIN' | 'GAME_OVER';
    content: string; // The question or the guess
    timestamp: number;
};

export type GameState = {
    roomId: string; // Short code
    hostId: string;
    players: Record<string, Player>; // All participants (Host, Players, Spectators)
    queue: string[]; // IDs of players waiting to play
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
};

export type JoinRoomParams = {
    roomId: string;
    playerName: string;
};
