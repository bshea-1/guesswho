import { useCallback } from 'react';
import { CHARACTERS } from '@/lib/characters';
import { GameState } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import CharacterCard from './CharacterCard';

export default function GameBoard({ game, playerId }: { game: GameState, playerId: string | null }) {
    const player = playerId ? game.players[playerId] : null;
    const isSpectator = !player || player.role === 'spectator';
    const { guessMode, setGuessMode } = useGameStore();
    const isMyTurn = game.turnPlayerId === playerId;

    const eliminatedIds = player?.eliminatedIds || [];
    const myCharacterId = player?.characterId;

    const handleClick = useCallback(async (charId: string, charName: string) => {
        if (isSpectator) return;

        // If in guess mode and it's my turn, make a guess
        if (guessMode && isMyTurn) {
            setGuessMode(false);
            await fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: game.roomId,
                    playerId,
                    type: 'GUESS',
                    payload: charName
                })
            });
            return;
        }

        // Otherwise toggle elimination
        await fetch('/api/game/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: game.roomId,
                playerId,
                type: 'TOGGLE_ELIMINATION',
                payload: charId
            })
        });
    }, [isSpectator, guessMode, isMyTurn, setGuessMode, game.roomId, playerId]);

    return (
        <div className="relative">
            {/* Guess mode banner */}
            {guessMode && isMyTurn && (
                <div className="sticky top-0 bg-orange-600 text-white text-center py-2 font-bold z-20 rounded-lg mb-2 animate-pulse">
                    🎯 Click on a character to make your guess!
                    <button
                        onClick={() => setGuessMode(false)}
                        className="ml-4 text-sm underline opacity-80 hover:opacity-100"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pb-20 p-2">
                {CHARACTERS.map((char) => {
                    const isEliminated = eliminatedIds.includes(char.id);
                    const isMyChar = char.id === myCharacterId;

                    return (
                        <CharacterCard
                            key={char.id}
                            char={char}
                            isEliminated={isEliminated}
                            isMyChar={isMyChar}
                            guessMode={guessMode}
                            isMyTurn={isMyTurn}
                            onClick={handleClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}
