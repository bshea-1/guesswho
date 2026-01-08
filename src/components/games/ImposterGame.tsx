'use client';

import React, { useState } from 'react';
import { GameState } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Users, Check, Clock, Vote, Trophy, RotateCcw } from 'lucide-react';

type Props = {
    game: GameState;
    playerId: string;
    sendAction: (action: string, payload?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export default function ImposterGame({ game, playerId, sendAction }: Props) {
    const {
        imposterPhase,
        imposterMode,
        imposterTurnNumber,
        imposterPlayerOrder,
        imposterHints,
        imposterVotes,
        imposterScores,
        imposterId,
        imposterSecretWord,
        imposterReadyPlayers,
        turnPlayerId,
        players,
        hostId
    } = game;

    const [hintInput, setHintInput] = useState('');
    const [selectedVote, setSelectedVote] = useState<string | null>(null);
    const [voteConfirmed, setVoteConfirmed] = useState(false);

    const myPlayer = players[playerId];
    const isImposter = myPlayer?.data?.isImposter === true;
    const mySecretWord = myPlayer?.data?.secretWord;
    const myHintWord = myPlayer?.data?.hintWord;
    const isHost = playerId === hostId;
    const isMyTurn = turnPlayerId === playerId;
    const hasVoted = imposterVotes?.some(v => v.voterId === playerId);
    const isReady = imposterReadyPlayers?.includes(playerId);

    // Get current round (1-3) from turn number
    const currentRound = Math.ceil((imposterTurnNumber || 1) / 3);
    const turnInRound = ((imposterTurnNumber || 1) - 1) % 3 + 1;

    // Handle role reveal ready
    const handleReady = () => {
        sendAction('IMPOSTER_READY');
    };

    // Handle text mode hint submission
    const handleSubmitHint = () => {
        if (!hintInput.trim()) return;
        sendAction('SUBMIT_IMPOSTER_HINT', { hint: hintInput.trim() });
        setHintInput('');
    };

    // Handle IRL mode end turn
    const handleEndTurn = () => {
        sendAction('END_IMPOSTER_TURN');
    };

    // Handle vote submission
    const handleSubmitVote = () => {
        if (!selectedVote) return;
        sendAction('SUBMIT_IMPOSTER_VOTE', { votedForId: selectedVote });
        setVoteConfirmed(true);
    };

    // Handle play again
    const handlePlayAgain = () => {
        sendAction('IMPOSTER_NEXT_ROUND');
    };

    // --- ROLE REVEAL PHASE ---
    if (imposterPhase === 'reveal') {
        return (
            <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/30 via-slate-950 to-indigo-900/30">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
                >
                    {isImposter ? (
                        <>
                            <div className="text-6xl mb-4">🎭</div>
                            <h2 className="text-3xl font-black text-red-400 mb-2">YOU ARE THE IMPOSTER</h2>
                            <p className="text-slate-400 mb-6">You don't know the secret word. Blend in!</p>

                            {myHintWord ? (
                                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 mb-6">
                                    <p className="text-sm text-red-300 uppercase tracking-wider font-bold mb-2">
                                        Hint Word (Turn 1 only)
                                    </p>
                                    <p className="text-3xl font-black text-white">{myHintWord}</p>
                                    <p className="text-xs text-red-400 mt-2">This hint disappears after your first turn!</p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                                    <p className="text-slate-400">Your hint has expired.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-6xl mb-4">🔍</div>
                            <h2 className="text-3xl font-black text-green-400 mb-2">YOU ARE NOT THE IMPOSTER</h2>
                            <p className="text-slate-400 mb-6">Give hints about the secret word. Find the imposter!</p>

                            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6 mb-6">
                                <p className="text-sm text-green-300 uppercase tracking-wider font-bold mb-2">
                                    Secret Word
                                </p>
                                <p className="text-3xl font-black text-white">{mySecretWord || imposterSecretWord}</p>
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleReady}
                        disabled={isReady}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isReady
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                            }`}
                    >
                        {isReady ? (
                            <span className="flex items-center justify-center gap-2">
                                <Check size={20} /> Ready! Waiting for others...
                            </span>
                        ) : (
                            "I'm Ready"
                        )}
                    </button>

                    <div className="mt-4 flex justify-center gap-2">
                        {imposterPlayerOrder?.map(pid => (
                            <div
                                key={pid}
                                className={`w-3 h-3 rounded-full ${imposterReadyPlayers?.includes(pid) ? 'bg-green-500' : 'bg-slate-600'
                                    }`}
                                title={players[pid]?.name}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- PLAYING PHASE ---
    if (imposterPhase === 'playing') {
        const currentPlayerName = players[turnPlayerId || '']?.name || 'Unknown';

        return (
            <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-900/20 via-slate-950 to-indigo-900/20 overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-slate-900/80 border-b border-white/10 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-400">Round {currentRound} of 3</p>
                            <p className="text-lg font-bold text-white">Turn {imposterTurnNumber} of 9</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Mode</p>
                            <p className={`font-bold ${imposterMode === 'text' ? 'text-blue-400' : 'text-orange-400'}`}>
                                {imposterMode === 'text' ? '💬 Text' : '🗣️ IRL'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Private Info Bar */}
                <div className={`p-3 ${isImposter ? 'bg-red-900/30' : 'bg-green-900/30'} border-b border-white/10`}>
                    <div className="flex items-center justify-center gap-2">
                        {isImposter ? (
                            <>
                                <EyeOff size={16} className="text-red-400" />
                                <span className="text-red-300 font-medium">You are the Imposter</span>
                                {myHintWord && (
                                    <span className="text-red-400 ml-2">| Hint: <strong>{myHintWord}</strong></span>
                                )}
                            </>
                        ) : (
                            <>
                                <Eye size={16} className="text-green-400" />
                                <span className="text-green-300 font-medium">Secret: <strong>{mySecretWord || imposterSecretWord}</strong></span>
                            </>
                        )}
                    </div>
                </div>

                {/* Text Mode: Timeline */}
                {imposterMode === 'text' && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                            {(imposterHints || []).map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl ${h.playerId === playerId ? 'bg-blue-600/30 border border-blue-500/30 ml-8' : 'bg-slate-800/50 mr-8'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-slate-300">
                                            {players[h.playerId]?.name || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-slate-500">Turn {h.turnNumber}</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">{h.hint}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* IRL Mode: Minimal UI */}
                {imposterMode === 'irl' && (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <p className="text-slate-400 mb-2">
                                {isMyTurn ? 'Say your hint out loud, then tap below' : 'Listen carefully...'}
                            </p>
                            <p className="text-3xl font-bold text-white mb-4">
                                {isMyTurn ? 'Your Turn!' : `${currentPlayerName}'s Turn`}
                            </p>
                            <div className="flex justify-center gap-4">
                                {imposterPlayerOrder?.map((pid, i) => (
                                    <div
                                        key={pid}
                                        className={`flex flex-col items-center p-3 rounded-lg ${pid === turnPlayerId ? 'bg-purple-600/30 ring-2 ring-purple-500' : 'bg-slate-800/50'
                                            }`}
                                    >
                                        <span className="text-2xl">👤</span>
                                        <span className="text-xs font-bold text-slate-300 mt-1">{players[pid]?.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-slate-900/80 border-t border-white/10 shrink-0">
                    {isMyTurn ? (
                        imposterMode === 'text' ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={hintInput}
                                    onChange={(e) => setHintInput(e.target.value)}
                                    placeholder="Enter your hint..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitHint()}
                                />
                                <button
                                    onClick={handleSubmitHint}
                                    disabled={!hintInput.trim()}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all active:scale-95"
                                >
                                    Submit
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEndTurn}
                                className="w-full py-6 bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl rounded-xl transition-all active:scale-95"
                            >
                                End Turn
                            </button>
                        )
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-slate-400 animate-pulse flex items-center justify-center gap-2">
                                <Clock size={18} /> Waiting for {currentPlayerName} to {imposterMode === 'text' ? 'submit hint' : 'end turn'}...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VOTING PHASE ---
    if (imposterPhase === 'voting') {
        const otherPlayers = imposterPlayerOrder?.filter(pid => pid !== playerId) || [];

        return (
            <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-amber-900/20 via-slate-950 to-red-900/20">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <Vote size={48} className="mx-auto mb-2 text-amber-400" />
                        <h2 className="text-2xl font-black text-amber-400">Vote for the Imposter</h2>
                        <p className="text-slate-400 text-sm">Who do you think is faking it?</p>
                    </div>

                    {hasVoted || voteConfirmed ? (
                        <div className="text-center py-8">
                            <Check size={48} className="mx-auto mb-4 text-green-400" />
                            <p className="text-xl font-bold text-white">Vote Submitted!</p>
                            <p className="text-slate-400 mt-2">Waiting for others...</p>
                            <div className="mt-4 flex justify-center gap-2">
                                {imposterPlayerOrder?.map(pid => (
                                    <div
                                        key={pid}
                                        className={`w-3 h-3 rounded-full ${imposterVotes?.some(v => v.voterId === pid) ? 'bg-amber-500' : 'bg-slate-600'
                                            }`}
                                        title={players[pid]?.name}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 mb-6">
                                {otherPlayers.map(pid => (
                                    <button
                                        key={pid}
                                        onClick={() => setSelectedVote(pid)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all ${selectedVote === pid
                                            ? 'bg-amber-600/30 border-amber-500 text-white'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        <span className="font-bold text-lg">{players[pid]?.name}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmitVote}
                                disabled={!selectedVote}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl text-lg transition-all active:scale-95"
                            >
                                Submit Vote
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // --- RESULTS PHASE ---
    if (imposterPhase === 'results') {
        const imposterName = players[imposterId || '']?.name || 'Unknown';
        const imposterWon = game.winnerId === imposterId;

        // Build vote breakdown
        const voteBreakdown: Record<string, string[]> = {};
        imposterVotes?.forEach(v => {
            if (!voteBreakdown[v.votedForId]) voteBreakdown[v.votedForId] = [];
            voteBreakdown[v.votedForId].push(players[v.voterId]?.name || 'Unknown');
        });

        // Sort players by score
        const sortedPlayers = [...(imposterPlayerOrder || [])].sort((a, b) => {
            return (imposterScores?.[b] || 0) - (imposterScores?.[a] || 0);
        });

        return (
            <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/20 via-slate-950 to-indigo-900/20 overflow-y-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
                >
                    {/* Winner Banner */}
                    <div className="text-center mb-6">
                        <Trophy size={48} className={`mx-auto mb-2 ${imposterWon ? 'text-red-400' : 'text-green-400'}`} />
                        <h2 className="text-3xl font-black text-white mb-2">
                            {imposterWon ? 'Imposter Wins!' : 'Non-Imposters Win!'}
                        </h2>
                        <p className="text-slate-400">
                            The imposter was <span className="font-bold text-purple-400">{imposterName}</span>
                        </p>
                    </div>

                    {/* Vote Breakdown */}
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-slate-300 mb-3">Vote Breakdown</h3>
                        <div className="space-y-2">
                            {imposterPlayerOrder?.map(pid => (
                                <div key={pid} className="flex justify-between items-center">
                                    <span className={`font-medium ${pid === imposterId ? 'text-red-400' : 'text-white'}`}>
                                        {players[pid]?.name} {pid === imposterId && '(Imposter)'}
                                    </span>
                                    <span className="text-slate-400 text-sm">
                                        {voteBreakdown[pid]?.length || 0} vote{(voteBreakdown[pid]?.length || 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scoreboard (Wins) */}
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-slate-300 mb-3">Wins</h3>
                        <div className="space-y-2">
                            {[...(imposterPlayerOrder || [])].sort((a, b) => {
                                return (players[b]?.wins || 0) - (players[a]?.wins || 0);
                            }).map((pid, i) => (
                                <div key={pid} className={`flex justify-between items-center p-2 rounded ${i === 0 ? 'bg-yellow-500/20' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        {i === 0 && <span className="text-yellow-400">👑</span>}
                                        <span className={`font-medium ${pid === playerId ? 'text-blue-400' : 'text-white'}`}>
                                            {players[pid]?.name} {pid === playerId && '(You)'}
                                        </span>
                                    </div>
                                    <span className="font-bold text-xl text-purple-400">
                                        {players[pid]?.wins || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Play Again Button */}
                    <button
                        onClick={handlePlayAgain}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> Play Again
                    </button>

                    <p className="text-center text-slate-500 text-xs mt-4">
                        New round with shuffled roles and new word
                    </p>
                </motion.div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="flex-1 flex items-center justify-center text-slate-500">
            Loading Imposter game...
        </div>
    );
}
