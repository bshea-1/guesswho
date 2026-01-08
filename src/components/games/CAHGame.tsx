'use client';

import React, { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

type Props = {
    gameState: GameState;
    playerId: string;
    sendAction: (action: string, payload?: any) => void;
};

export default function CAHGame({ gameState, playerId, sendAction }: Props) {
    const { cahBlackCard, cahSubmissions, cahPhase, cahCzarId, players, matchStatus, winnerId, hostId } = gameState;
    const player = players[playerId];
    const isCzar = playerId === cahCzarId;
    const isHost = playerId === hostId;
    const isGameOver = matchStatus === 'finished';

    // Auto-return to lobby after 5 seconds when game ends (host triggers)
    useEffect(() => {
        if (isGameOver && isHost) {
            const timer = setTimeout(() => {
                sendAction('CAH_GO_TO_LOBBY', null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isGameOver, isHost, sendAction]);

    // Hand management
    const hand = (player?.data?.hand as string[]) || [];
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [customCardTexts, setCustomCardTexts] = useState<string[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);

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
            } else if (pickCount === 1) {
                setSelectedCards([card]);
            }
        }
    };

    const handleSubmitCustomCard = () => {
        // Validate we have enough custom cards
        const trimmedCards = customCardTexts.map(t => t.trim()).filter(t => t.length > 0);
        if (trimmedCards.length !== pickCount) return;

        sendAction('SUBMIT_CARDS', trimmedCards);
        setCustomCardTexts([]);
        setShowCustomInput(false);
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
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {/* Top Bar: Compact on mobile */}
            <div className="flex flex-wrap justify-between items-center p-2 sm:p-4 bg-slate-800 shadow-lg gap-2">
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm sm:text-xl font-black text-yellow-500 truncate">
                        {isCzar ? "YOU ARE THE CZAR" : `${players[cahCzarId || '']?.name || '?'} IS CZAR`}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                        {cahPhase === 'pick' && "Choosing cards..."}
                        {cahPhase === 'judge' && "Czar judging..."}
                        {cahPhase === 'result' && "Winner!"}
                    </p>
                </div>
                {/* Scores - Horizontal scroll on mobile */}
                <div className="flex gap-2 sm:gap-4 overflow-x-auto max-w-[50%] shrink-0">
                    {Object.values(players).filter(p => p.role === 'player').slice(0, 5).map(p => (
                        <div key={p.id} className="flex flex-col items-center shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 truncate max-w-[40px] sm:max-w-none">{p.name}</span>
                            <span className="text-sm sm:text-lg font-black">{p.data?.score || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                {/* Black Card - Centered, responsive size */}
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="bg-black text-white p-3 sm:p-6 rounded-xl w-full max-w-xs sm:max-w-sm shadow-2xl border border-slate-700 relative min-h-[120px] sm:min-h-[200px]">
                        <h3 className="text-base sm:text-xl font-bold leading-tight">
                            {cahBlackCard?.text.replace(/_/g, '_______')}
                        </h3>
                        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white text-black text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                            {cahBlackCard?.pick}
                        </div>
                    </div>
                </div>

                {/* Submissions Area (Judge/Result phase) */}
                {cahPhase !== 'pick' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {(cahSubmissions || []).map((sub) => (
                            <motion.div
                                key={sub.playerId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handlePickWinner(sub.playerId)}
                                className={`
                                    bg-white text-black p-2 sm:p-4 rounded-lg sm:rounded-xl min-h-[100px] sm:min-h-[150px] shadow-xl 
                                    cursor-pointer transition-all active:scale-95
                                    ${sub.isWinner ? 'ring-4 ring-yellow-500 scale-105 z-10' : ''}
                                    ${isCzar && cahPhase === 'judge' ? 'hover:ring-2 hover:ring-blue-500' : ''}
                                `}
                            >
                                <div className="font-bold text-xs sm:text-base leading-snug">
                                    {sub.cards.map((text, i) => (
                                        <p key={i} className="mb-1">{text}</p>
                                    ))}
                                </div>
                                {cahPhase === 'result' && sub.isWinner && (
                                    <div className="mt-2 text-center">
                                        <span className="bg-yellow-500 text-black font-bold px-2 py-0.5 rounded text-xs">WINNER</span>
                                        {sub.isCustom && <span className="ml-1 bg-purple-500 text-white font-bold px-2 py-0.5 rounded text-xs">Custom (+0.5)</span>}
                                        <p className="text-[10px] mt-1 text-slate-500">{players[sub.playerId]?.name}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Czar Waiting Message */}
                {cahPhase === 'pick' && isCzar && (
                    <div className="flex items-center justify-center py-12 text-slate-500 animate-pulse text-center px-4">
                        <p>Waiting for plebs to submit their cards...</p>
                    </div>
                )}

                {/* Submitted Message */}
                {cahPhase === 'pick' && hasSubmitted && (
                    <div className="flex items-center justify-center py-8 bg-slate-800/50 rounded-xl">
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">Submitted!</h3>
                            <p className="text-slate-400 text-sm">Waiting for others...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Next Round Button - Only show if game is NOT over */}
            {cahPhase === 'result' && isCzar && !isGameOver && (
                <div className="p-3 sm:p-4 border-t border-slate-800">
                    <button
                        onClick={handleNextRound}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 sm:py-4 rounded-xl text-lg sm:text-xl shadow-xl transition-all active:scale-95"
                    >
                        NEXT ROUND
                    </button>
                </div>
            )}

            {/* Game Over Screen */}
            {isGameOver && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-yellow-500 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-black text-yellow-400 mb-2">GAME OVER!</h2>
                        <p className="text-xl text-white mb-6">
                            {winnerId && players[winnerId] ? `${players[winnerId].name} wins with ${players[winnerId].data?.score || 0} points!` : 'Game Over!'}
                        </p>
                        <div className="space-y-3">
                            <p className="text-slate-400 text-sm">Final Scores:</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {Object.values(players).filter(p => p.role === 'player').sort((a, b) => (b.data?.score || 0) - (a.data?.score || 0)).map(p => (
                                    <div key={p.id} className={`px-3 py-2 rounded-lg ${p.id === winnerId ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-800'}`}>
                                        <span className="font-bold">{p.name}</span>
                                        <span className="text-slate-400 ml-2">{p.data?.score || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm mt-6">Host can start a new game from the lobby.</p>
                    </div>
                </div>
            )}

            {/* Player Hand (pick phase, not czar, not submitted) */}
            {cahPhase === 'pick' && !isCzar && isPlayer && !hasSubmitted && (
                <div className="border-t border-slate-800 bg-slate-950 shrink-0">
                    {/* Header */}
                    <div className="flex justify-between items-center p-2 sm:p-3">
                        <span className="text-xs sm:text-sm text-slate-400 font-bold uppercase">Pick {pickCount}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCustomInput(!showCustomInput)}
                                className="flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm sm:text-base font-bold transition shadow-lg active:scale-95"
                            >
                                <Plus size={20} /> Custom
                            </button>
                            <button
                                disabled={selectedCards.length !== pickCount}
                                onClick={handleSubmit}
                                className={`
                                    px-6 py-2 sm:px-8 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg active:scale-95
                                    ${selectedCards.length === pickCount
                                        ? 'bg-green-500 hover:bg-green-400 text-white transform hover:scale-105'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                `}
                            >
                                Submit Selection
                            </button>
                        </div>
                    </div>

                    {/* Custom Card Input */}
                    <AnimatePresence>
                        {showCustomInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-2 pb-2 overflow-hidden"
                            >
                                <div className="flex flex-col gap-2">
                                    {Array.from({ length: pickCount }).map((_, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={customCardTexts[idx] || ''}
                                            onChange={(e) => {
                                                const newTexts = [...customCardTexts];
                                                newTexts[idx] = e.target.value;
                                                setCustomCardTexts(newTexts);
                                            }}
                                            placeholder={`Custom card ${idx + 1}...`}
                                            className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                            onKeyDown={(e) => e.key === 'Enter' && idx === pickCount - 1 && handleSubmitCustomCard()}
                                        />
                                    ))}
                                    <button
                                        onClick={handleSubmitCustomCard}
                                        disabled={customCardTexts.filter(t => t?.trim()).length !== pickCount}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-bold transition"
                                    >
                                        Send {pickCount > 1 ? `(${pickCount} cards)` : ''}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Cards - Horizontal scroll, smaller on mobile */}
                    <div className="flex overflow-x-auto gap-2 p-2 pb-4 snap-x snap-mandatory">
                        {hand.map((card, idx) => (
                            <motion.div
                                key={idx}
                                layoutId={`card-${idx}`}
                                onClick={() => handleToggleCard(card)}
                                className={`
                                    flex-shrink-0 w-40 sm:w-56 h-56 sm:h-80 rounded-xl p-4 sm:p-6 
                                    cursor-pointer shadow-lg border-2 transition-all snap-center
                                    ${selectedCards.includes(card)
                                        ? 'bg-blue-600 text-white border-blue-400 -translate-y-4 shadow-blue-500/50 scale-105 z-10'
                                        : 'bg-white text-black border-transparent hover:scale-105 active:scale-95'}
                                `}
                            >
                                <p className="font-bold text-sm sm:text-xl leading-snug select-none">{card}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
