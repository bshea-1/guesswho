import { CHARACTERS } from '@/lib/characters';
import { GameState } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';

export default function GameBoard({ game, playerId }: { game: GameState, playerId: string | null }) {
    const player = playerId ? game.players[playerId] : null;
    const isSpectator = !player || player.role === 'spectator';
    const { guessMode, setGuessMode } = useGameStore();
    const isMyTurn = game.turnPlayerId === playerId;

    const eliminatedIds = player?.eliminatedIds || [];
    const myCharacterId = player?.characterId;

    const handleClick = async (charId: string, charName: string) => {
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
    };

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
                        <motion.div
                            layout
                            key={char.id}
                            onClick={() => handleClick(char.id, char.name)}
                            className={clsx(
                                "relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 group",
                                guessMode && isMyTurn && !isMyChar ? "border-orange-500 hover:border-orange-400 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30" :
                                    isEliminated ? "border-slate-800 opacity-40 grayscale hover:grayscale-0 hover:opacity-60" :
                                        "border-blue-500/30 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/20 bg-slate-800",
                                isMyChar && "ring-2 ring-green-500 border-green-500"
                            )}
                        >
                            <Image
                                src={char.image}
                                alt={char.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 12.5vw"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4">
                                <p className="text-center font-bold text-[10px] sm:text-xs text-shadow truncate px-0.5">{char.name}</p>
                            </div>

                            {isEliminated && !guessMode && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                                    <div className="-rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                                </div>
                            )}

                            {isMyChar && (
                                <div className="absolute top-1 right-1 bg-green-600 text-[8px] sm:text-[10px] px-1 py-0.5 rounded-full font-bold shadow-sm z-10">
                                    YOU
                                </div>
                            )}

                            {guessMode && isMyTurn && !isMyChar && (
                                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">GUESS?</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
