
import React, { useState } from 'react';
import { GameState, Player } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
    gameState: GameState;
    playerId: string;
    sendAction: (action: string, payload?: any) => void;
};

export default function CAHGame({ gameState, playerId, sendAction }: Props) {
    const { cahBlackCard, cahSubmissions, cahPhase, cahCzarId, players } = gameState;
    const player = players[playerId];
    const isCzar = playerId === cahCzarId;

    // Hand management
    const hand = (player?.data?.hand as string[]) || []; // Spectators/Hosts might not have data
    const [selectedCards, setSelectedCards] = useState<string[]>([]);

    // If we're not a player (spectator), just watch
    const isPlayer = player?.role === 'player';

    const pickCount = cahBlackCard?.pick || 1;

    // Have I submitted?
    const mySubmission = cahSubmissions?.find(s => s.playerId === playerId);
    const hasSubmitted = !!mySubmission;

    const handleToggleCard = (card: string) => {
        if (!isPlayer || isCzar || hasSubmitted) return;

        if (selectedCards.includes(card)) {
            setSelectedCards(selectedCards.filter(c => c !== card));
        } else {
            if (selectedCards.length < pickCount) {
                setSelectedCards([...selectedCards, card]);
            } else {
                // Replace the first selected if full? Or just block?
                // Standard UI: de-select required.
                // Or "Select up to N".
                // Let's do simple: If 1, swap. If >1, block.
                if (pickCount === 1) {
                    setSelectedCards([card]);
                }
            }
        }
    };

    const handleSubmit = () => {
        if (selectedCards.length !== pickCount) return;
        sendAction('SUBMIT_CARDS', selectedCards);
        setSelectedCards([]);
    };

    const handlePickWinner = (winnerId: string) => {
        if (!isCzar || cahPhase !== 'judge') return;
        sendAction('PICK_WINNER', winnerId);
    };

    const handleNextRound = () => {
        if (!isCzar) return;
        sendAction('CAH_NEXT_ROUND');
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-4">
            {/* Top Bar: Czar Info & Game State */}
            <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-xl font-black text-yellow-500">
                        {isCzar ? "YOU ARE THE CZAR" : `${players[cahCzarId || '']?.name || 'Unknown'} IS THE CZAR`}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {cahPhase === 'pick' && "Players are choosing..."}
                        {cahPhase === 'judge' && "Czar is judging..."}
                        {cahPhase === 'result' && "Round Winner decided!"}
                    </p>
                </div>
                <div className="flex space-x-4">
                    {/* Scores could go here */}
                    {Object.values(players).filter(p => p.role === 'player').map(p => (
                        <div key={p.id} className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400">{p.name}</span>
                            <span className="text-lg font-black">{p.data?.score || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Black Card Area */}
            <div className="flex justify-center mb-8">
                <div className="bg-black text-white p-6 rounded-xl w-64 h-80 shadow-2xl border border-slate-700 flex flex-col relative">
                    <h3 className="text-xl font-bold leading-tight">
                        {cahBlackCard?.text.replace(/_/g, '_______')}
                    </h3>
                    <div className="mt-auto absolute bottom-4 right-4 bg-white text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {cahBlackCard?.pick}
                    </div>
                </div>
            </div>

            {/* Center Area: Submissions (if judging) or Result */}
            <div className="flex-1 overflow-y-auto min-h-[200px]">
                {cahPhase !== 'pick' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                        {(cahSubmissions || []).map((sub, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    bg-white text-black p-4 rounded-xl w-48 h-64 shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95
                                    ${sub.isWinner ? 'ring-4 ring-yellow-500 scale-110 z-10' : ''}
                                    ${isCzar && cahPhase === 'judge' ? 'hover:ring-4 hover:ring-blue-500' : ''}
                                `}
                                onClick={() => handlePickWinner(sub.playerId)}
                            >
                                <div className="font-bold text-lg">
                                    {sub.cards.map((text, i) => (
                                        <p key={i} className="mb-2">{text}</p>
                                    ))}
                                </div>
                                {cahPhase === 'result' && sub.isWinner && (
                                    <div className="mt-4 text-center">
                                        <span className="bg-yellow-500 text-black font-bold px-2 py-1 rounded">WINNER</span>
                                        <p className="text-xs mt-1 text-slate-500">{players[sub.playerId]?.name}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {cahPhase === 'pick' && isCzar && (
                    <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
                        Waiting for plebs to submit their cards...
                    </div>
                )}
            </div>

            {/* Bottom Area: Controls & Hand */}
            {cahPhase === 'result' && isCzar && (
                <div className="flex justify-center p-4">
                    <button
                        onClick={handleNextRound}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-12 rounded-full text-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        START NEXT ROUND
                    </button>
                </div>
            )}

            {/* My Hand (Only if playing, not Czar, and picking phase) */}
            {cahPhase === 'pick' && !isCzar && isPlayer && !hasSubmitted && (
                <div className="mt-auto pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">Your Hand (Pick {pickCount})</span>
                        <button
                            disabled={selectedCards.length !== pickCount}
                            onClick={handleSubmit}
                            className={`
                                px-6 py-2 rounded-full font-bold transition-all
                                ${selectedCards.length === pickCount
                                    ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg hover:scale-105'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            Submit Selection
                        </button>
                    </div>
                    <div className="flex flex-nowrap overflow-x-auto space-x-3 pb-4 px-2 snap-x">
                        {hand.map((card, idx) => (
                            <motion.div
                                key={idx}
                                layoutId={card}
                                onClick={() => handleToggleCard(card)}
                                className={`
                                    flex-shrink-0 w-40 h-56 rounded-lg p-3 cursor-pointer shadow-lg border-2 transition-all snap-center
                                    ${selectedCards.includes(card)
                                        ? 'bg-blue-600 text-white border-blue-400 -translate-y-4 shadow-blue-500/50'
                                        : 'bg-white text-black border-transparent hover:bg-slate-100'}
                                `}
                            >
                                <p className="font-bold text-sm leading-snug select-none">{card}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submitted Message */}
            {cahPhase === 'pick' && hasSubmitted && (
                <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-xl mb-4">
                    <div className="text-center">
                        <div className="text-4xl mb-2">🎉</div>
                        <h3 className="text-xl font-bold text-white">Cards Submitted!</h3>
                        <p className="text-slate-400">Waiting for other slowpokes...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
