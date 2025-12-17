import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from './types';

interface ClientStore {
    username: string;
    setUsername: (name: string) => void;
    playerId: string | null;
    setPlayerId: (id: string | null) => void;
    roomId: string | null;
    setRoomId: (id: string | null) => void;
    // Local cache of game state for optimistic updates
    game: GameState | null;
    setGame: (game: GameState | null) => void;
    clearGame: () => void;
    // Guess mode - when true, clicking a card makes a guess
    guessMode: boolean;
    setGuessMode: (mode: boolean) => void;
    timeOffset: number;
    setTimeOffset: (offset: number) => void;
}

export const useGameStore = create<ClientStore>()(
    persist(
        (set) => ({
            username: '',
            setUsername: (name) => set({ username: name }),
            playerId: null,
            setPlayerId: (id) => set({ playerId: id }),
            roomId: null,
            setRoomId: (id) => set({ roomId: id }),
            game: null,
            setGame: (game) => set({ game }),
            clearGame: () => set({ game: null, roomId: null, playerId: null }),
            guessMode: false,
            setGuessMode: (mode) => set({ guessMode: mode }),
            timeOffset: 0,
            setTimeOffset: (offset) => set({ timeOffset: offset }),
        }),
        {
            name: 'guesswho-storage',
            partialize: (state) => ({ username: state.username, playerId: state.playerId, roomId: state.roomId }),
        }
    )
);
