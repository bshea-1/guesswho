import { Character } from '@/lib/types'; // Need Character type
import { CHARACTERS } from '@/lib/characters';
import { GameState } from '@/lib/types';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';

export default function GameBoard({ game, playerId }: { game: GameState, playerId: string | null }) {
    const player = playerId ? game.players[playerId] : null;
    const isSpectator = !player || player.role === 'spectator';

    // If spectator, whose board do we show? Usually both merged or toggleable.
    // For MVP: Show generic board, eliminated = greyed out if "Show Boards" enabled?
    // Let's implement active player's view first.

    const eliminatedIds = player?.eliminatedIds || [];
    const myCharacterId = player?.characterId;

    const handleToggle = async (charId: string) => {
        if (isSpectator) return;

        // Optimistic/API call
        // We perform the API call to sync state
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 pb-20 p-2">
            {CHARACTERS.map((char) => {
                const isEliminated = eliminatedIds.includes(char.id);
                const isMyChar = char.id === myCharacterId;

                return (
                    <motion.div
                        layout
                        key={char.id}
                        onClick={() => handleToggle(char.id)}
                        className={clsx(
                            "relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 group",
                            isEliminated ? "border-slate-800 opacity-40 grayscale hover:grayscale-0 hover:opacity-60" : "border-blue-500/30 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/20 bg-slate-800",
                            isMyChar && "ring-2 ring-green-500 border-green-500"
                        )}
                    >
                        <Image
                            src={char.image}
                            alt={char.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 15vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4">
                            <p className="text-center font-bold text-xs text-shadow truncate px-1">{char.name}</p>
                        </div>

                        {isEliminated && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                                <div className="-rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                            </div>
                        )}

                        {isMyChar && (
                            <div className="absolute top-1 right-1 bg-green-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">
                                YOU
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
