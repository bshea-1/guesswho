'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { Character } from '@/lib/types';

interface CharacterCardProps {
    char: Character;
    isEliminated: boolean;
    isMyChar: boolean;
    ownerName?: string;
    isOpponentChar?: boolean;
    opponentName?: string;
    guessMode: boolean;
    isMyTurn: boolean;
    onClick: (id: string, name: string) => void;
}

const CharacterCard = memo(function CharacterCard({
    char,
    isEliminated,
    isMyChar,
    ownerName,
    isOpponentChar,
    opponentName,
    guessMode,
    isMyTurn,
    onClick
}: CharacterCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={!isEliminated && !guessMode ? { scale: 1.05, y: -2 } : {}}
            transition={{ duration: 0.2 }}
            onClick={() => onClick(char.id, char.name)}
            className={clsx(
                "relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-colors duration-200 group",
                guessMode && isMyTurn && !isMyChar ? "border-orange-500 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/30" :
                    isEliminated ? "border-slate-800 opacity-40 grayscale hover:grayscale-0 hover:opacity-60" :
                        "border-blue-500/30 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/20 bg-slate-800",
                isMyChar && "ring-2 ring-green-500 border-green-500",
                isOpponentChar && "ring-2 ring-red-500 border-red-500"
            )}
        >
            <Image
                src={char.image}
                alt={char.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12.5vw"
            />

            {isEliminated && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                    <div className="-rotate-45 w-full h-0.5 bg-red-600/80 absolute" />
                </div>
            )}

            {isMyChar && (
                <div className="absolute top-1 right-1 bg-green-600 text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm z-10 max-w-[80%] truncate">
                    {ownerName || 'YOU'}
                </div>
            )}

            {isOpponentChar && (
                <div className="absolute top-1 left-1 bg-red-600 text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm z-10 max-w-[80%] truncate">
                    {opponentName || 'THEM'}
                </div>
            )}

            {guessMode && isMyTurn && !isMyChar && (
                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">GUESS?</span>
                </div>
            )}
        </motion.div>
    );
});

export default CharacterCard;
