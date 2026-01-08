import { useCallback } from 'react';
import { CHARACTERS } from '@/lib/characters';
import { GameState } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import CharacterCard from './CharacterCard';

export default function GameBoard({ game, targetPlayerId, viewerId }: { game: GameState, targetPlayerId: string, viewerId: string | null }) {
    const targetPlayer = game.players[targetPlayerId];
    // If targetPlayer doesn't exist (e.g. hasn't loaded yet), render nothing or a placeholder
    // But usually it should exist if we are calling this component.

    const viewerPlayer = viewerId ? game.players[viewerId] : null;
    const isSpectator = !viewerPlayer || viewerPlayer.role === 'spectator';

    const { guessMode, setGuessMode } = useGameStore();

    // Interaction rules:
    // You can only interact with YOUR own board.
    const isMyBoard = targetPlayerId === viewerId;
    const canInteract = isMyBoard && !isSpectator;
    const isMyTurn = game.turnPlayerId === viewerId; // Use viewerId for turn check

    // Privacy rules:
    // You can see the secret character (Green Outline) IF:
    // 1. It is YOUR board.
    // 2. OR you are a Spectator.
    const canSeeSecret = isMyBoard || isSpectator;

    const eliminatedIds = targetPlayer?.eliminatedIds || [];
    const myCharacterId = targetPlayer?.characterId;

    const handleClick = useCallback(async (charId: string, charName: string) => {
        if (!canInteract) return;

        // If in guessMode and it's my turn, make a guess
        if (guessMode && isMyTurn) {
            setGuessMode(false);
            await fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: game.roomId,
                    playerId: viewerId,
                    type: 'GUESS',
                    payload: charName
                })
            });
            return;
        }

        // Must be my turn to toggle elimination? usually yes, or anytime?
        // Rules say: "Ask a question..." then "Flip down...".
        // Original code didn't restrict elimination to turn, keeping permissive for now.

        // Toggle elimination
        await fetch('/api/game/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: game.roomId,
                playerId: viewerId,
                type: 'TOGGLE_ELIMINATION',
                payload: charId
            })
        });
    }, [canInteract, guessMode, isMyTurn, setGuessMode, game.roomId, viewerId]);

    if (!targetPlayer) return null;

    return (
        <div className="relative">
            {/* Guess mode banner - Only show on MY board if it is MY turn */}
            {guessMode && isMyTurn && isMyBoard && (
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

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pb-4 p-2">
                {CHARACTERS.map((char) => {
                    const isEliminated = eliminatedIds.includes(char.id);
                    // Only pass isMyChar if we are allowed to see it
                    const isMyChar = canSeeSecret && char.id === myCharacterId;

                    // Opponent character logic for spectators
                    // Find the OTHER active player
                    let isOpponentChar = false;
                    let opponentName = '';

                    if (isSpectator) {
                        const opponent = Object.values(game.players).find(p =>
                            p.id !== targetPlayerId &&
                            (p.role === 'player' || (p.role === 'host' && p.characterId))
                        );
                        if (opponent && opponent.characterId === char.id) {
                            isOpponentChar = true;
                            opponentName = opponent.name;
                        }
                    }

                    return (
                        <CharacterCard
                            key={char.id}
                            char={char}
                            isEliminated={isEliminated}
                            isMyChar={!!isMyChar}
                            ownerName={isMyBoard ? 'YOU' : targetPlayer.name}
                            isOpponentChar={isOpponentChar}
                            opponentName={opponentName}
                            // guessMode visual cues only on my board
                            guessMode={guessMode && isMyBoard}
                            isMyTurn={isMyTurn}
                            onClick={canInteract ? handleClick : () => { }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
