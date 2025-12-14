export type { Character } from './characters';

export type PlayerRole = 'host' | 'player' | 'spectator';

export type Player = {
    id: string; // socket/pusher id or session id
    name: string; // display name
    role: PlayerRole;
    characterId: string | null; // The character they are assigned
    eliminatedIds: string[]; // Characters this player has crossed out
    isReady: boolean;
};

export type GameStatus = 'lobby' | 'selecting' | 'playing' | 'finished';

export type Turn = {
    playerId: string;
    action: 'ask' | 'guess' | 'answer' | 'join' | 'WIN' | 'GAME_OVER';
    content: string; // The question or the guess
    timestamp: number;
};

export type GameState = {
    roomId: string; // Short code
    hostId: string;
    players: Record<string, Player>; // Max 2 players
    spectators: number; // Count of spectators
    status: GameStatus;
    turnPlayerId: string | null; // ID of the player whose turn it is
    winnerId: string | null;
    history: Turn[];
    settings: {
        mode: 'regular' | 'text';
        spectatorView: 'log' | 'boards';
        visibility: 'public' | 'unlisted' | 'private';
    };
    createdAt: number;
};

export type CreateRoomParams = {
    hostName: string;
    mode: GameState['settings']['mode'];
    visibility: GameState['settings']['visibility'];
};

export type JoinRoomParams = {
    roomId: string;
    playerName: string;
};
